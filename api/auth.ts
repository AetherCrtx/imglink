import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import {
  getAuthUserAsync,
  NEON_AUTH_BASE_URL,
  createToken,
  isRootAdmin,
  syncAndGetPublicUser,
  type AuthUser,
} from './_lib/auth.js';
import { ensureEnvLoaded } from './_lib/env.js';
import {
  getClientIp,
  checkRateLimit,
  recordFailedAuthAttempt,
  resetFailedAuthAttempts,
  verifyAdminSecret,
  createAdminToken,
  verifyAdminToken,
  applySecurityHeaders,
} from './_lib/security.js';

ensureEnvLoaded();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Defensive Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Key, x-admin-key, X-Admin-Secret, x-admin-secret, X-Admin-Token, x-admin-token'
  );
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query.action as string) || req.body?.action;
  const clientIp = getClientIp(req);

  // Anti-DDoS and Brute-Force Rate Limiting
  const rateLimit = checkRateLimit(clientIp, action === 'verify-admin-key' ? 'auth' : 'general');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many requests. Defense shield active. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: 'Server configuration error: DATABASE_URL is not set.' });
  }
  const sql = neon(dbUrl);

  const getCleanOrigin = () => {
    if (req.headers.origin) {
      return String(req.headers.origin).replace(/\/$/, '');
    }
    if (req.headers.referer) {
      try {
        return new URL(req.headers.referer as string).origin;
      } catch {}
    }
    const host = (req.headers['x-forwarded-host'] || req.headers.host) as string;
    if (host) {
      const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
      return `${proto}://${host}`.replace(/\/$/, '');
    }
    return (process.env.APP_URL || 'https://imglink.web.id').replace(/\/$/, '');
  };

  // 1. Google OAuth Initiation
  if (action === 'google') {
    try {
      const origin = getCleanOrigin();
      const callbackURL = `${origin}/api/auth?action=oauth-callback`;

      const neonAuthRes = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origin,
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL,
        }),
      });

      const data = await neonAuthRes.json();
      if (data.url) {
        if (req.method === 'GET') {
          return res.redirect(302, data.url);
        }
        return res.status(200).json({ url: data.url });
      }

      const errMsg =
        typeof data.error === 'string'
          ? data.error
          : data.message || data.error?.message || 'Google OAuth failed';

      if (req.method === 'GET') {
        return res.redirect(302, `${origin}/?login=error`);
      }
      return res.status(neonAuthRes.status || 400).json({ error: errMsg });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google OAuth initialization failed';
      console.error('[auth google error]:', err);
      const origin = getCleanOrigin();
      if (req.method === 'GET') {
        return res.redirect(302, `${origin}/?login=error`);
      }
      return res.status(500).json({ error: message });
    }
  }

  // 2. OAuth Callback from Neon Auth / Google
  if (action === 'oauth-callback') {
    try {
      const origin = getCleanOrigin();
      const queryToken = (req.query.token || req.query.session_token || req.query.sessionToken) as string;
      const clientIp =
        ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) ||
        req.socket?.remoteAddress;

      let sessions: any[] = [];

      // Priority 1: Match explicit token parameter if returned in query
      if (queryToken) {
        sessions = await sql`
          SELECT s.id, s.token, s."userId", s."createdAt", u.name, u.email, u.image
          FROM neon_auth.session s
          JOIN neon_auth.user u ON s."userId" = u.id
          WHERE s.token = ${queryToken} AND s."expiresAt" > NOW()
          LIMIT 1
        `;
      }

      // Priority 2: Match client IP address within recent session window
      if ((!sessions || sessions.length === 0) && clientIp) {
        sessions = await sql`
          SELECT s.id, s.token, s."userId", s."createdAt", u.name, u.email, u.image
          FROM neon_auth.session s
          JOIN neon_auth.user u ON s."userId" = u.id
          WHERE s."ipAddress" = ${clientIp} AND s."expiresAt" > NOW() AND s."createdAt" > NOW() - INTERVAL '15 minutes'
          ORDER BY s."createdAt" DESC
          LIMIT 1
        `;
      }

      // Priority 3: Fallback to most recently created active session
      if (!sessions || sessions.length === 0) {
        sessions = await sql`
          SELECT s.id, s.token, s."userId", s."createdAt", u.name, u.email, u.image
          FROM neon_auth.session s
          JOIN neon_auth.user u ON s."userId" = u.id
          WHERE s."expiresAt" > NOW()
          ORDER BY s."createdAt" DESC
          LIMIT 1
        `;
      }

      if (!sessions || sessions.length === 0) {
        console.error('[oauth-callback]: No active session found in neon_auth');
        return res.redirect(302, `${origin}/?login=error&reason=no_session`);
      }

      const session = sessions[0];
      const syncedUser = await syncAndGetPublicUser(sql, {
        id: String(session.userId || session.id),
        email: session.email,
        name: session.name || session.email.split('@')[0],
        avatarUrl: session.image || null,
      });

      const token = createToken(syncedUser);
      const domainAttr = origin.includes('imglink.web.id') ? '; Domain=.imglink.web.id' : '';

      res.setHeader(
        'Set-Cookie',
        `imglink_token=${token}; Path=/; Max-Age=604800; Secure; SameSite=Lax${domainAttr}`
      );

      return res.redirect(302, `${origin}/?login=success&token=${encodeURIComponent(token)}`);
    } catch (err: unknown) {
      console.error('[oauth-callback error]:', err);
      const origin = getCleanOrigin();
      return res.redirect(302, `${origin}/?login=error`);
    }
  }

  // 3. Optional OAuth Verifier / Token Exchange
  if (action === 'exchange' || action === 'callback') {
    try {
      const verifier =
        (req.query.verifier as string) ||
        (req.query.neon_auth_session_verifier as string) ||
        req.body?.verifier;

      if (!verifier) {
        return res.status(400).json({ error: 'Missing session verifier parameter.' });
      }

      let userObj: { id: string; email: string; name?: string; image?: string } | null = null;

      try {
        const neonRes = await fetch(
          `${NEON_AUTH_BASE_URL}/get-session?neon_auth_session_verifier=${encodeURIComponent(verifier)}`,
          {
            headers: {
              'User-Agent': 'ImgLink-Auth/1.0',
            },
          }
        );

        if (neonRes.ok) {
          const sessionData = await neonRes.json();
          if (sessionData && sessionData.user) {
            userObj = sessionData.user;
          }
        }
      } catch (neonFetchErr) {
        console.warn('[neon-auth fetch get-session failed]:', neonFetchErr);
      }

      // If Neon Auth HTTP endpoint rejected due to cross-site cookie blocking, resolve from database
      if (!userObj) {
        const clientIp =
          ((req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()) ||
          req.socket?.remoteAddress;

        let sessions: any[] = [];
        if (clientIp) {
          sessions = await sql`
            SELECT s.id, s.token, s."userId", s."createdAt", u.name, u.email, u.image
            FROM neon_auth.session s
            JOIN neon_auth.user u ON s."userId" = u.id
            WHERE s."ipAddress" = ${clientIp} AND s."expiresAt" > NOW() AND s."createdAt" > NOW() - INTERVAL '30 minutes'
            ORDER BY s."createdAt" DESC
            LIMIT 1
          `;
        }

        if (!sessions || sessions.length === 0) {
          sessions = await sql`
            SELECT s.id, s.token, s."userId", s."createdAt", u.name, u.email, u.image
            FROM neon_auth.session s
            JOIN neon_auth.user u ON s."userId" = u.id
            WHERE s."expiresAt" > NOW()
            ORDER BY s."createdAt" DESC
            LIMIT 1
          `;
        }

        if (sessions && sessions.length > 0) {
          const s = sessions[0];
          userObj = {
            id: String(s.userId || s.id),
            email: s.email,
            name: s.name,
            image: s.image,
          };
        }
      }

      if (!userObj) {
        return res.status(400).json({ error: 'Invalid or expired verifier.' });
      }

      const user = await syncAndGetPublicUser(sql, {
        id: String(userObj.id),
        email: userObj.email,
        name: userObj.name || userObj.email.split('@')[0],
        avatarUrl: userObj.image || null,
      });

      const token = createToken(user);

      if (req.method === 'GET') {
        const origin = getCleanOrigin();
        res.setHeader(
          'Set-Cookie',
          `imglink_token=${token}; Path=/; Max-Age=604800; Secure; SameSite=Lax`
        );
        return res.redirect(302, `${origin}/?login=success&token=${encodeURIComponent(token)}`);
      }

      return res.status(200).json({ user, token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to exchange verifier';
      console.error('[auth exchange error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 4. User requests Pro Upgrade
  if (action === 'request-pro') {
    try {
      const user = await getAuthUserAsync(req);
      if (!user) {
        return res.status(401).json({ error: 'You must be signed in to request Pro status.' });
      }

      if (user.tier === 'pro' || user.role === 'admin') {
        return res.status(200).json({ user, message: 'You are already a Pro member.' });
      }

      const note = typeof req.body?.note === 'string' ? req.body.note.slice(0, 500) : null;

      const updatedRows = await sql`
        UPDATE public.users
        SET pro_request_status = 'pending',
            pro_requested_at = NOW(),
            pro_request_note = ${note}
        WHERE id = ${user.id}
        RETURNING id, email, name, avatar_url, role, tier, pro_request_status, pro_requested_at, pro_request_note
      `;

      if (updatedRows.length === 0) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      const updatedUser: AuthUser = {
        ...user,
        proRequestStatus: 'pending',
        proRequestedAt: new Date().toISOString(),
        proRequestNote: note,
      };

      const newToken = createToken(updatedUser);

      return res.status(200).json({
        user: updatedUser,
        token: newToken,
        message: 'Pro upgrade request submitted successfully. An administrator will review it.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit Pro upgrade request';
      console.error('[auth request-pro error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 5. Secret Admin Passkey Verification (Strict server-side verification)
  if (action === 'verify-admin-key') {
    const key = String(req.body?.key || req.query.key || '').trim();
    if (!key) {
      return res.status(400).json({ valid: false, error: 'Administrative passkey required.' });
    }

    const isValid = verifyAdminSecret(key);
    if (isValid) {
      resetFailedAuthAttempts(clientIp);
      const adminToken = createAdminToken();
      return res.status(200).json({
        valid: true,
        adminToken,
        message: 'Clearance verified. Admin session granted.',
      });
    }

    const { remainingAttempts } = recordFailedAuthAttempt(clientIp);
    return res.status(401).json({
      valid: false,
      error:
        remainingAttempts > 0
          ? `ACCESS DENIED // INVALID CLEARANCE KEY (${remainingAttempts} attempts remaining).`
          : 'ACCESS DENIED // GATEWAY TEMPORARILY LOCKED DUE TO SECURITY PROTOCOL.',
    });
  }

  // 6. Admin: List Members
  if (action === 'admin-members') {
    try {
      const adminToken =
        (req.headers['x-admin-token'] as string) ||
        (req.query.adminToken as string) ||
        req.body?.adminToken;
      const adminKey =
        (req.headers['x-admin-key'] as string) ||
        (req.headers['x-admin-secret'] as string) ||
        (req.query.adminKey as string) ||
        (req.query.key as string) ||
        req.body?.adminKey ||
        req.body?.key;
      const user = await getAuthUserAsync(req);

      const isTokenValid = adminToken ? verifyAdminToken(adminToken) : false;
      const isKeyValid = adminKey ? verifyAdminSecret(adminKey) : false;
      const isAuthorized = isTokenValid || isKeyValid || (user && user.role === 'admin');

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Access denied. Secret admin clearance required.' });
      }

      const members = await sql`
        SELECT u.id::text as id, u.email, u.name, u.avatar_url, u.role,
               CASE WHEN u.role = 'admin' THEN 'pro' ELSE u.tier END as tier,
               CASE WHEN u.role = 'admin' THEN 'approved' ELSE u.pro_request_status END as pro_request_status,
               u.pro_requested_at, u.pro_request_note, u.created_at,
               COALESCE(img.img_count, 0)::int as image_count
        FROM public.users u
        LEFT JOIN (
          SELECT user_id, count(*)::int as img_count
          FROM public.images
          GROUP BY user_id
        ) img ON u.id::text = img.user_id
        ORDER BY
          CASE WHEN u.pro_request_status = 'pending' THEN 0 ELSE 1 END,
          u.created_at DESC
      `;

      return res.status(200).json({ members });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve members';
      console.error('[auth admin-members error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 7. Admin: Approve / Reject / Manage Member Tier
  if (action === 'admin-pro-action') {
    try {
      const adminToken =
        (req.headers['x-admin-token'] as string) ||
        (req.query.adminToken as string) ||
        req.body?.adminToken;
      const adminKey =
        (req.headers['x-admin-key'] as string) ||
        (req.headers['x-admin-secret'] as string) ||
        (req.query.adminKey as string) ||
        (req.query.key as string) ||
        req.body?.adminKey ||
        req.body?.key;
      const user = await getAuthUserAsync(req);

      const isTokenValid = adminToken ? verifyAdminToken(adminToken) : false;
      const isKeyValid = adminKey ? verifyAdminSecret(adminKey) : false;
      const isAuthorized = isTokenValid || isKeyValid || (user && user.role === 'admin');

      if (!isAuthorized) {
        return res.status(403).json({ error: 'Access denied. Secret admin clearance required.' });
      }

      const { targetUserId, decision, tier } = req.body || {};
      if (!targetUserId) {
        return res.status(400).json({ error: 'Missing targetUserId.' });
      }

      const targetUserRows = await sql`SELECT email FROM public.users WHERE id::text = ${targetUserId}`;
      if (targetUserRows.length === 0) {
        return res.status(404).json({ error: 'Target user not found.' });
      }

      if (decision === 'approve') {
        await sql`
          UPDATE public.users
          SET tier = 'pro',
              pro_request_status = 'approved'
          WHERE id::text = ${targetUserId}
        `;
      } else if (decision === 'reject') {
        await sql`
          UPDATE public.users
          SET pro_request_status = 'rejected'
          WHERE id::text = ${targetUserId}
        `;
      } else if (decision === 'set-tier') {
        const newTier = tier === 'pro' ? 'pro' : 'free';
        await sql`
          UPDATE public.users
          SET tier = ${newTier},
              pro_request_status = ${newTier === 'pro' ? 'approved' : 'none'}
          WHERE id::text = ${targetUserId}
        `;
      } else {
        return res.status(400).json({ error: 'Invalid decision action.' });
      }

      return res.status(200).json({ success: true, message: 'Member tier updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update member status';
      console.error('[auth admin-pro-action error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 7. Check Session (Me)
  if (req.method === 'GET' || action === 'me') {
    try {
      const user = await getAuthUserAsync(req);
      if (user) {
        const token = createToken(user);
        return res.status(200).json({ user, token });
      }

      // Check Neon Auth directly via cookie if present
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const checkRes = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, {
          headers: { Cookie: cookieHeader },
        });
        const sessionData = await checkRes.json();
        if (sessionData?.user) {
          const syncedUser = await syncAndGetPublicUser(sql, {
            id: String(sessionData.user.id),
            name: sessionData.user.name || sessionData.user.email?.split('@')[0],
            email: sessionData.user.email,
            avatarUrl: sessionData.user.image || null,
          });
          const token = createToken(syncedUser);
          return res.status(200).json({
            user: syncedUser,
            token,
          });
        }
      }

      return res.status(200).json({ user: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify session';
      return res.status(500).json({ error: message });
    }
  }

  // 8. Sign Out
  if (action === 'logout') {
    res.setHeader(
      'Set-Cookie',
      'imglink_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax'
    );
    return res.status(200).json({ message: 'Signed out successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

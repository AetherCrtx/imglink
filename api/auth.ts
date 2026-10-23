import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthUserAsync, NEON_AUTH_BASE_URL, createToken } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = (req.query.action as string) || req.body?.action;

  // 1. Google OAuth Initiation
  if (action === 'google') {
    try {
      const origin =
        process.env.APP_URL ||
        req.headers.origin ||
        (req.headers.referer ? new URL(req.headers.referer as string).origin : 'https://imglink.web.id');

      const neonAuthRes = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: String(origin),
        },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: String(origin),
        }),
      });

      const data = await neonAuthRes.json();
      if (data.url) {
        return res.status(200).json({ url: data.url });
      }
      return res.status(neonAuthRes.status).json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google OAuth initialization failed';
      console.error('[auth google error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 2. Check Session (Me)
  if (req.method === 'GET' || action === 'me') {
    try {
      const user = await getAuthUserAsync(req);
      if (user) {
        return res.status(200).json({ user });
      }

      // Check Neon Auth directly via cookie if present
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const checkRes = await fetch(`${NEON_AUTH_BASE_URL}/get-session`, {
          headers: { Cookie: cookieHeader },
        });
        const sessionData = await checkRes.json();
        if (sessionData?.user) {
          return res.status(200).json({
            user: {
              id: sessionData.user.id,
              name: sessionData.user.name,
              email: sessionData.user.email,
              avatarUrl: sessionData.user.image || null,
            },
            token: sessionData.session?.token,
          });
        }
      }

      return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to verify session';
      return res.status(500).json({ error: message });
    }
  }

  // 3. Email Register / Sign Up via Neon Auth
  if (req.method === 'POST' && action === 'register') {
    try {
      const { email, password, name } = req.body || {};
      const origin =
        process.env.APP_URL || req.headers.origin || 'https://imglink.web.id';

      const neonRes = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: String(origin),
        },
        body: JSON.stringify({
          email: String(email).trim().toLowerCase(),
          password: String(password),
          name: String(name || email.split('@')[0]),
        }),
      });

      const data = await neonRes.json();
      if (!neonRes.ok) {
        return res.status(neonRes.status).json({
          error: data.message || 'Registration failed. Email may already be registered.',
        });
      }

      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.image || null,
      };

      return res.status(201).json({
        user,
        token: data.token,
        message: 'Account created successfully with Neon Auth!',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration error';
      console.error('[auth register error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 4. Email Login via Neon Auth
  if (req.method === 'POST' && (action === 'login' || !action)) {
    try {
      const { email, password } = req.body || {};
      const origin =
        process.env.APP_URL || req.headers.origin || 'https://imglink.web.id';

      const neonRes = await fetch(`${NEON_AUTH_BASE_URL}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: String(origin),
        },
        body: JSON.stringify({
          email: String(email).trim().toLowerCase(),
          password: String(password),
        }),
      });

      const data = await neonRes.json();
      if (!neonRes.ok) {
        return res.status(neonRes.status).json({
          error: data.message || 'Invalid email or password.',
        });
      }

      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        avatarUrl: data.user.image || null,
      };

      return res.status(200).json({
        user,
        token: data.token,
        message: 'Signed in successfully with Neon Auth!',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication error';
      console.error('[auth login error]:', err);
      return res.status(500).json({ error: message });
    }
  }

  // 5. Sign Out
  if (action === 'logout') {
    return res.status(200).json({ message: 'Signed out successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

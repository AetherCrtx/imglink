import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

import { ensureEnvLoaded } from './env.js';

ensureEnvLoaded();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Server configuration error: JWT_SECRET environment variable is missing.');
    }
    return 'imglink-dev-ephemeral-jwt-secret';
  }
  return secret;
}

export const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL || '';

export const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'rashqaandrean@gmail.com,finn9aming@gmail.com')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean)
);

export function isRootAdmin(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase().trim());
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'user' | 'admin';
  tier: 'free' | 'pro';
  proRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
  proRequestedAt?: string | null;
  proRequestNote?: string | null;
  imageCount?: number;
}

export function createToken(user: AuthUser, expiresInDays = 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
      tier: user.tier,
      proRequestStatus: user.proRequestStatus,
      proRequestedAt: user.proRequestedAt || null,
      proRequestNote: user.proRequestNote || null,
      imageCount: user.imageCount || 0,
      exp,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getJwtSecret())
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyLocalToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', getJwtSecret())
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const email = String(decoded.email || '').toLowerCase().trim();
    const isAdmin = isRootAdmin(email) || decoded.role === 'admin';

    return {
      id: String(decoded.id),
      email,
      name: decoded.name || email.split('@')[0] || 'User',
      avatarUrl: decoded.avatarUrl || null,
      role: isAdmin ? 'admin' : 'user',
      tier: isAdmin ? 'pro' : (decoded.tier === 'pro' ? 'pro' : 'free'),
      proRequestStatus: isAdmin ? 'approved' : (decoded.proRequestStatus || 'none'),
      proRequestedAt: decoded.proRequestedAt || null,
      proRequestNote: decoded.proRequestNote || null,
      imageCount: typeof decoded.imageCount === 'number' ? decoded.imageCount : 0,
    };
  } catch {
    return null;
  }
}

export async function syncAndGetPublicUser(
  sql: any,
  baseUser: { id: string; email: string; name: string; avatarUrl?: string | null }
): Promise<AuthUser> {
  const emailLower = baseUser.email.toLowerCase().trim();
  const isAdmin = isRootAdmin(emailLower);
  const defaultRole = isAdmin ? 'admin' : 'user';
  const defaultTier = isAdmin ? 'pro' : 'free';
  const defaultProStatus = isAdmin ? 'approved' : 'none';

  // 1. Upsert into public.users
  const userRows = await sql`
    INSERT INTO public.users (id, email, name, avatar_url, role, tier, pro_request_status, created_at)
    VALUES (${baseUser.id}, ${emailLower}, ${baseUser.name}, ${baseUser.avatarUrl || null}, ${defaultRole}, ${defaultTier}, ${defaultProStatus}, NOW())
    ON CONFLICT (email) DO UPDATE
    SET name = EXCLUDED.name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        role = CASE WHEN EXCLUDED.email IN ('rashqaandrean@gmail.com', 'finn9aming@gmail.com') THEN 'admin' ELSE public.users.role END,
        tier = CASE
          WHEN EXCLUDED.email IN ('rashqaandrean@gmail.com', 'finn9aming@gmail.com') OR public.users.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'pro'
          ELSE public.users.tier
        END,
        pro_request_status = CASE
          WHEN EXCLUDED.email IN ('rashqaandrean@gmail.com', 'finn9aming@gmail.com') OR public.users.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'approved'
          ELSE public.users.pro_request_status
        END
    RETURNING id, email, name, avatar_url, role, tier, pro_request_status, pro_requested_at, pro_request_note
  `;

  const user = userRows[0];
  const userId = String(user.id);
  const isAdminUser = isAdmin || user.role === 'admin';

  // 2. Count images
  const countRows = await sql`
    SELECT count(*)::int as count FROM public.images WHERE user_id = ${userId}
  `;
  const imageCount = countRows[0]?.count ?? 0;

  return {
    id: userId,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url || null,
    role: (isAdminUser ? 'admin' : (user.role || 'user')) as 'user' | 'admin',
    tier: (isAdminUser || user.tier === 'pro' ? 'pro' : 'free') as 'free' | 'pro',
    proRequestStatus: (isAdminUser ? 'approved' : (user.pro_request_status || 'none')) as 'none' | 'pending' | 'approved' | 'rejected',
    proRequestedAt: user.pro_requested_at ? new Date(user.pro_requested_at).toISOString() : null,
    proRequestNote: user.pro_request_note || null,
    imageCount,
  };
}

/**
 * Extracts and verifies the authenticated user from Neon Auth session or JWT
 */
export async function getAuthUserAsync(req: {
  headers: Record<string, string | string[] | undefined>;
}): Promise<AuthUser | null> {
  ensureEnvLoaded();

  let token: string | null = null;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  // Also check cookie if header not present
  if (!token && typeof req.headers.cookie === 'string') {
    const cookies = req.headers.cookie.split(';');
    for (const c of cookies) {
      const [key, val] = c.trim().split('=');
      if (
        key === '__Secure-neon-auth.session_token' ||
        key === 'neon-auth.session_token' ||
        key === 'imglink_token' ||
        key === 'snaplink_token'
      ) {
        token = decodeURIComponent(val);
        break;
      }
    }
  }

  const dbUrl = process.env.DATABASE_URL;

  if (!token || !dbUrl) {
    return null;
  }

  const cleanToken = token.includes('.') ? token.split('.')[0] : token;

  if (dbUrl) {
    try {
      const sql = neon(dbUrl);

      // 1. Try resolving against Neon Auth session table in database
      const rows = await sql`
        SELECT u.id, u.name, u.email, u.image
        FROM neon_auth.session s
        JOIN neon_auth.user u ON s."userId" = u.id
        WHERE (s.token = ${token} OR s.token = ${cleanToken}) AND s."expiresAt" > NOW()
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return await syncAndGetPublicUser(sql, {
          id: String(rows[0].id),
          name: rows[0].name || rows[0].email?.split('@')[0] || 'User',
          email: rows[0].email,
          avatarUrl: rows[0].image || null,
        });
      }

      // 2. If token is local JWT, verify and sync latest state from DB
      const localUser = verifyLocalToken(token);
      if (localUser) {
        return await syncAndGetPublicUser(sql, localUser);
      }
    } catch (dbErr) {
      console.error('[auth db session lookup error]:', dbErr);
    }
  }

  // 3. Fallback to purely local token verification
  return verifyLocalToken(token);
}

// Synchronous helper for local JWT token check
export function getAuthUser(req: {
  headers: Record<string, string | string[] | undefined>;
}): AuthUser | null {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    return verifyLocalToken(token);
  }
  return null;
}

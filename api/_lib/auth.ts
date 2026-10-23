import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

import { ensureEnvLoaded } from './env';

ensureEnvLoaded();

const JWT_SECRET = process.env.JWT_SECRET || 'piclink-secret-key-neon-backblaze-2026';
export const NEON_AUTH_BASE_URL =
  process.env.NEON_AUTH_BASE_URL ||
  'https://ep-divine-butterfly-azwhepvg.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export function createToken(user: AuthUser, expiresInDays = 7): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ ...user, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
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
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      avatarUrl: decoded.avatarUrl || null,
    };
  } catch {
    return null;
  }
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
        key === 'snaplink_token'
      ) {
        token = decodeURIComponent(val);
        break;
      }
    }
  }

  if (!token) return null;

  const cleanToken = token.includes('.') ? token.split('.')[0] : token;

  // 1. Try resolving against Neon Auth session table in database
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const sql = neon(dbUrl);
      const rows = await sql`
        SELECT u.id, u.name, u.email, u.image
        FROM neon_auth.session s
        JOIN neon_auth.user u ON s."userId" = u.id
        WHERE (s.token = ${token} OR s.token = ${cleanToken}) AND s."expiresAt" > NOW()
        LIMIT 1
      `;
      if (rows && rows.length > 0) {
        return {
          id: String(rows[0].id),
          name: rows[0].name || rows[0].email?.split('@')[0] || 'User',
          email: rows[0].email,
          avatarUrl: rows[0].image || null,
        };
      }
    } catch (dbErr) {
      console.error('[auth db session lookup error]:', dbErr);
    }
  }

  // 2. Try verifying as local JWT
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

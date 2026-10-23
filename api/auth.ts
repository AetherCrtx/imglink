import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq } from 'drizzle-orm';
import { db } from './_lib/db';
import { users } from './_lib/schema';
import { hashPassword, verifyPassword, createToken, getAuthUser } from './_lib/auth';

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

  // GET: Check Current User (me)
  if (req.method === 'GET' || action === 'me') {
    try {
      const user = getAuthUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
      }

      // Refresh user details from DB
      const existing = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'User no longer exists.' });
      }

      return res.status(200).json({ user: existing[0] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to verify session', details: message });
    }
  }

  // POST: Register or Login
  if (req.method === 'POST') {
    const { email, password, name } = req.body || {};

    // 1. REGISTER
    if (action === 'register') {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const userName = (typeof name === 'string' && name.trim()) || email.split('@')[0];

      try {
        const cleanEmail = email.trim().toLowerCase();

        // Check if email already registered
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, cleanEmail))
          .limit(1);

        if (existing.length > 0) {
          return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const passwordHash = await hashPassword(password);
        const [newUser] = await db
          .insert(users)
          .values({
            email: cleanEmail,
            passwordHash,
            name: userName,
          })
          .returning({
            id: users.id,
            email: users.email,
            name: users.name,
          });

        const token = createToken(newUser);
        return res.status(201).json({
          user: newUser,
          token,
          message: 'Account created successfully!',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[auth register error]:', err);
        return res.status(500).json({ error: 'Failed to register account', details: message });
      }
    }

    // 2. LOGIN
    if (action === 'login' || !action) {
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required.' });
      }

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required.' });
      }

      try {
        const cleanEmail = email.trim().toLowerCase();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, cleanEmail))
          .limit(1);

        if (existing.length === 0) {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = existing[0];
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = createToken({
          id: user.id,
          email: user.email,
          name: user.name,
        });

        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
          message: 'Signed in successfully!',
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[auth login error]:', err);
        return res.status(500).json({ error: 'Failed to authenticate', details: message });
      }
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

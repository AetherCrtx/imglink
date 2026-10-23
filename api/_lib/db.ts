import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB] Warning: DATABASE_URL is not set.');
}

const sql = neon(connectionString || '');
export const db = drizzle(sql, { schema });

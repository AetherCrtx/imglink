import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Auto-load .env if not loaded (for local Node / dev environments)
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if file not found
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[DB] Warning: DATABASE_URL is not set.');
}

const sql = neon(connectionString || '');
export const db = drizzle(sql, { schema });

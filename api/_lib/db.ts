import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';
import { ensureEnvLoaded } from './env.js';

export function getDb(): NeonHttpDatabase<typeof schema> {
  ensureEnvLoaded();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Server configuration error: DATABASE_URL is not set.');
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

// Transparent proxy to always query with the latest environment configuration
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = getDb() as any;
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

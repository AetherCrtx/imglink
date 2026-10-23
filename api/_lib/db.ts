import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { ensureEnvLoaded } from './env';

export function getDb(): NeonHttpDatabase<typeof schema> {
  ensureEnvLoaded();

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_Gjp2AgVy8ieL@ep-divine-butterfly-azwhepvg-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

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

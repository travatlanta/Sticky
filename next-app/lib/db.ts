import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

// Global reference to preserve connection across hot reloads
const globalForDb = globalThis as unknown as {
  db: NeonHttpDatabase<typeof schema> | undefined;
};

function createDb(): NeonHttpDatabase<typeof schema> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql as any, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

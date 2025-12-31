import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isVercel = process.env.VERCEL === '1';

function createDb() {
  if (isVercel) {
    const sql = neon(process.env.DATABASE_URL!);
    return drizzleNeon(sql as any, { schema });
  } else {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
    return drizzlePg(pool, { schema });
  }
}

export const db = createDb();

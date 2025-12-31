import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Enable fetch connection caching for Vercel serverless
neonConfig.fetchConnectionCache = true;

const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

function createDb() {
  if (isVercel || isProduction) {
    console.log('[DB] Using Neon HTTP driver with fetch connection cache');
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle(sql as any, { schema });
  } else {
    console.log('[DB] Using pg Pool driver for development');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
    return drizzlePg(pool, { schema });
  }
}

export const db = createDb();

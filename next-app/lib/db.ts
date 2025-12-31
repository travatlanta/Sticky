import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const isVercel = process.env.VERCEL === '1';
const isProduction = process.env.NODE_ENV === 'production';

function createDb() {
  if (isVercel || isProduction) {
    neonConfig.webSocketConstructor = ws;
    const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
    return drizzle(pool, { schema });
  } else {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });
    return drizzlePg(pool, { schema });
  }
}

export const db = createDb();

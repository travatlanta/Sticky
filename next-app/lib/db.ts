import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Validate DATABASE_URL exists
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Determine runtime environment
const isVercel = process.env.VERCEL === '1';
const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== 'undefined';
const forceNeonHttp = isVercel || isEdgeRuntime || process.env.NODE_ENV === 'production';

// Create database instance based on environment
function createDb() {
  if (forceNeonHttp) {
    // Production: Use Neon HTTP driver (works in serverless/edge)
    const sql = neon(databaseUrl!);
    return drizzleNeon(sql as any, { schema });
  } else {
    // Development: Use standard pg Pool
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: false,
    });
    return drizzlePg(pool, { schema });
  }
}

// Export db with proper type for query methods
export const db = createDb() as ReturnType<typeof drizzleNeon<typeof schema>>;

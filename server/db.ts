import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// ---------------------------------------------------------------------------
// Schema compatibility check
//
// In production deployments it's possible that the database schema lags behind
// application code.  When new columns are added (for example, per-product
// shipping configuration fields), attempting to select or insert into these
// fields without first migrating the database will cause queries to fail and
// return 500 errors to the client.  To improve resilience during rollouts,
// perform a one‑time best‑effort schema compatibility check when the module
// is first loaded.  If the `shipping_type` enum or the corresponding
// columns on the `products` table are missing, this routine will create
// them.  If the database user lacks permission to alter the schema, the
// operation will fail silently and the server will continue to operate.

async function ensureShippingSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        -- Create enum type if it does not exist
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipping_type') THEN
          CREATE TYPE shipping_type AS ENUM ('free', 'flat', 'calculated');
        END IF;

        -- Add shipping_type column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'shipping_type'
        ) THEN
          ALTER TABLE products ADD COLUMN shipping_type shipping_type DEFAULT 'calculated';
        END IF;

        -- Add flat_shipping_price column if missing
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'flat_shipping_price'
        ) THEN
          ALTER TABLE products ADD COLUMN flat_shipping_price NUMERIC(10,2);
        END IF;
      END $$;
    `);
  } catch (err) {
    // Log the error but do not throw.  The application will still start
    console.error('Schema compatibility check failed:', err);
  } finally {
    client.release();
  }
}

// Kick off the schema check; do not await so module initialization
// continues without blocking server startup.  Any errors will be logged.
ensureShippingSchema().catch((err) => {
  console.error('Failed to ensure shipping schema:', err);
});

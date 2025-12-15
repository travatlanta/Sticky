-- Migration: Add per-product shipping fields to products table
-- This migration ensures that the database schema matches the updated
-- application schema which includes per-product shipping configuration.
--
-- It performs three operations:
--   1. Create the `shipping_type` enum type if it does not already exist.
--   2. Add the `shipping_type` column to the `products` table with a default
--      value of `'calculated'`.
--   3. Add the `flat_shipping_price` column to the `products` table.
--
-- If these columns already exist (for example, if this migration has
-- already been applied), the statements will not throw errors due to
-- the `IF NOT EXISTS` clauses.

-- 1. Create enum type for shipping if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'shipping_type'
  ) THEN
    CREATE TYPE shipping_type AS ENUM ('free', 'flat', 'calculated');
  END IF;
END $$;

-- 2. Add `shipping_type` column to products table if missing
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_type shipping_type DEFAULT 'calculated';

-- 3. Add `flat_shipping_price` column to products table if missing
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS flat_shipping_price NUMERIC(10,2);
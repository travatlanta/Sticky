ALTER TABLE product_options
ADD COLUMN IF NOT EXISTS tier2_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier3_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier4_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier5_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier6_price_modifier DECIMAL(10, 4);

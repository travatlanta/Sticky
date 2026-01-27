import { db } from '../lib/db';
import { products, productOptions, pricingTiers, categories } from '../shared/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function main() {
  console.log('Generating production SQL...\n');

  const allCategories = await db.select().from(categories);
  const allProducts = await db.select().from(products);
  const allOptions = await db.select().from(productOptions);
  const allTiers = await db.select().from(pricingTiers);

  let sqlOutput = `-- Production SQL for Sticky Banditos
-- Generated on ${new Date().toISOString()}
-- Run this in your Neon SQL console

-- First, add missing schema columns if needed
ALTER TABLE product_options 
ADD COLUMN IF NOT EXISTS tier2_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier3_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier4_price_modifier DECIMAL(10, 4);

ALTER TABLE products ADD COLUMN IF NOT EXISTS use_global_tiers BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS global_pricing_tiers (
  id SERIAL PRIMARY KEY,
  tier_number INTEGER NOT NULL UNIQUE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  discount_percent DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Categories
`;

  // Categories
  for (const cat of allCategories) {
    const name = cat.name.replace(/'/g, "''");
    const slug = cat.slug.replace(/'/g, "''");
    const desc = (cat.description || '').replace(/'/g, "''");
    sqlOutput += `INSERT INTO categories (id, name, slug, description, display_order, is_active) 
VALUES (${cat.id}, '${name}', '${slug}', '${desc}', ${cat.displayOrder || 0}, ${cat.isActive ?? true}) 
ON CONFLICT (id) DO NOTHING;
`;
  }

  sqlOutput += `
-- Reset sequences
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));

-- Products
`;

  // Products
  for (const prod of allProducts) {
    const name = prod.name.replace(/'/g, "''");
    const slug = prod.slug.replace(/'/g, "''");
    const desc = (prod.description || '').replace(/'/g, "''");
    sqlOutput += `INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (${prod.id}, '${name}', '${slug}', '${desc}', ${prod.categoryId}, '${prod.basePrice}', ${prod.minQuantity || 1}, ${prod.isActive ?? true}, ${prod.isFeatured ?? false}, ${prod.useGlobalTiers ?? false}, ${prod.templateWidth || 1200}, ${prod.templateHeight || 1200}, ${prod.supportsCustomShape ?? false}, '${prod.shippingType || 'calculated'}') 
ON CONFLICT (id) DO NOTHING;
`;
  }

  sqlOutput += `
-- Reset sequences
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));

-- Product Options (Materials, Coatings, Cuts)
`;

  // Product Options
  for (const opt of allOptions) {
    const name = opt.name.replace(/'/g, "''");
    const value = (opt.value || '').replace(/'/g, "''");
    const tier2 = opt.tier2PriceModifier ? `'${opt.tier2PriceModifier}'` : 'NULL';
    const tier3 = opt.tier3PriceModifier ? `'${opt.tier3PriceModifier}'` : 'NULL';
    const tier4 = opt.tier4PriceModifier ? `'${opt.tier4PriceModifier}'` : 'NULL';
    sqlOutput += `INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (${opt.id}, ${opt.productId}, '${opt.optionType}', '${name}', '${value}', '${opt.priceModifier || '0.00'}', ${tier2}, ${tier3}, ${tier4}, ${opt.isDefault ?? false}, ${opt.isActive ?? true}, ${opt.displayOrder || 0}) 
ON CONFLICT (id) DO NOTHING;
`;
  }

  sqlOutput += `
-- Reset sequences
SELECT setval('product_options_id_seq', COALESCE((SELECT MAX(id) FROM product_options), 1));

-- Pricing Tiers
`;

  // Pricing Tiers
  for (const tier of allTiers) {
    sqlOutput += `INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (${tier.id}, ${tier.productId}, ${tier.minQuantity}, ${tier.maxQuantity}, '${tier.pricePerUnit}') 
ON CONFLICT (id) DO NOTHING;
`;
  }

  sqlOutput += `
-- Reset sequences
SELECT setval('pricing_tiers_id_seq', COALESCE((SELECT MAX(id) FROM pricing_tiers), 1));

-- Done!
`;

  const outputPath = 'scripts/production-import.sql';
  fs.writeFileSync(outputPath, sqlOutput);
  console.log(`✅ SQL written to ${outputPath}`);
  console.log(`\nCopy and run this SQL in your Neon production database console.`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

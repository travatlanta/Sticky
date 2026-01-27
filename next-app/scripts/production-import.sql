-- Production SQL for Sticky Banditos
-- Generated on 2026-01-27T05:37:09.936Z
-- Run this in your Neon SQL console

-- First, add missing schema columns if needed
ALTER TABLE product_options 
ADD COLUMN IF NOT EXISTS tier2_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier3_price_modifier DECIMAL(10, 4),
ADD COLUMN IF NOT EXISTS tier4_price_modifier DECIMAL(10, 4);

ALTER TABLE products ADD COLUMN IF NOT EXISTS use_global_tiers BOOLEAN DEFAULT true;

-- Add order columns for admin-created orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_admin_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS artwork_status VARCHAR(50) DEFAULT 'approved';

CREATE TABLE IF NOT EXISTS global_pricing_tiers (
  id SERIAL PRIMARY KEY,
  tier_number INTEGER NOT NULL UNIQUE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  discount_percent DECIMAL(5, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Categories
INSERT INTO categories (id, name, slug, description, display_order, is_active) 
VALUES (28, 'Circles', 'circles', 'Round circle stickers in various sizes from 1" to 6"', 1, true) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name, slug, description, display_order, is_active) 
VALUES (29, 'Squares', 'squares', 'Square and rectangle stickers in various sizes', 2, true) 
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));

-- Products
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (273, '3.5" Circle Stickers', '3-5-inch-circle-stickers', 'High-quality 3.5" circle stickers printed on premium vinyl.', 28, '0.18', 1, true, false, false, 1050, 1050, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (274, '4" Circle Stickers', '4-inch-circle-stickers', 'High-quality 4" circle stickers printed on premium vinyl.', 28, '0.19', 1, true, false, false, 1200, 1200, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (268, '1" Circle Stickers', '1-inch-circle-stickers', 'High-quality 1" circle stickers printed on premium vinyl.', 28, '0.13', 1, true, false, false, 300, 300, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (269, '1.5" Circle Stickers', '1-5-inch-circle-stickers', 'High-quality 1.5" circle stickers printed on premium vinyl.', 28, '0.14', 1, true, false, false, 450, 450, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (270, '2" Circle Stickers', '2-inch-circle-stickers', 'High-quality 2" circle stickers printed on premium vinyl.', 28, '0.15', 1, true, false, false, 600, 600, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (271, '2.5" Circle Stickers', '2-5-inch-circle-stickers', 'High-quality 2.5" circle stickers printed on premium vinyl.', 28, '0.16', 1, true, false, false, 750, 750, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (272, '3" Circle Stickers', '3-inch-circle-stickers', 'High-quality 3" circle stickers printed on premium vinyl.', 28, '0.17', 1, true, false, false, 900, 900, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (275, '4.5" Circle Stickers', '4-5-inch-circle-stickers', 'High-quality 4.5" circle stickers printed on premium vinyl.', 28, '0.20', 1, true, false, false, 1350, 1350, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (276, '5" Circle Stickers', '5-inch-circle-stickers', 'High-quality 5" circle stickers printed on premium vinyl.', 28, '0.21', 1, true, false, false, 1500, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (277, '5.5" Circle Stickers', '5-5-inch-circle-stickers', 'High-quality 5.5" circle stickers printed on premium vinyl.', 28, '0.22', 1, true, false, false, 1650, 1650, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (278, '6" Circle Stickers', '6-inch-circle-stickers', 'High-quality 6" circle stickers printed on premium vinyl.', 28, '0.23', 1, true, false, false, 1800, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (279, '1x1 Square Stickers', '1x1-square-stickers', 'High-quality 1x1 square stickers printed on premium vinyl.', 29, '0.12', 1, true, false, false, 300, 300, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (280, '1x2 Square Stickers', '1x2-square-stickers', 'High-quality 1x2 square stickers printed on premium vinyl.', 29, '0.14', 1, true, false, false, 300, 600, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (281, '1x3 Square Stickers', '1x3-square-stickers', 'High-quality 1x3 square stickers printed on premium vinyl.', 29, '0.15', 1, true, false, false, 300, 900, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (282, '1x4 Square Stickers', '1x4-square-stickers', 'High-quality 1x4 square stickers printed on premium vinyl.', 29, '0.16', 1, true, false, false, 300, 1200, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (283, '1x5 Square Stickers', '1x5-square-stickers', 'High-quality 1x5 square stickers printed on premium vinyl.', 29, '0.17', 1, true, false, false, 300, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (284, '1x6 Square Stickers', '1x6-square-stickers', 'High-quality 1x6 square stickers printed on premium vinyl.', 29, '0.19', 1, true, false, false, 300, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (285, '2x2 Square Stickers', '2x2-square-stickers', 'High-quality 2x2 square stickers printed on premium vinyl.', 29, '0.16', 1, true, false, false, 600, 600, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (286, '2x3 Square Stickers', '2x3-square-stickers', 'High-quality 2x3 square stickers printed on premium vinyl.', 29, '0.21', 1, true, false, false, 600, 900, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (287, '2x4 Square Stickers', '2x4-square-stickers', 'High-quality 2x4 square stickers printed on premium vinyl.', 29, '0.24', 1, true, false, false, 600, 1200, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (288, '2x5 Square Stickers', '2x5-square-stickers', 'High-quality 2x5 square stickers printed on premium vinyl.', 29, '0.27', 1, true, false, false, 600, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (289, '2x6 Square Stickers', '2x6-square-stickers', 'High-quality 2x6 square stickers printed on premium vinyl.', 29, '0.30', 1, true, false, false, 600, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (290, '3x3 Square Stickers', '3x3-square-stickers', 'High-quality 3x3 square stickers printed on premium vinyl.', 29, '0.23', 1, true, false, false, 900, 900, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (291, '3x4 Square Stickers', '3x4-square-stickers', 'High-quality 3x4 square stickers printed on premium vinyl.', 29, '0.27', 1, true, false, false, 900, 1200, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (292, '3x5 Square Stickers', '3x5-square-stickers', 'High-quality 3x5 square stickers printed on premium vinyl.', 29, '0.30', 1, true, false, false, 900, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (293, '3x6 Square Stickers', '3x6-square-stickers', 'High-quality 3x6 square stickers printed on premium vinyl.', 29, '0.34', 1, true, false, false, 900, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (294, '4x4 Square Stickers', '4x4-square-stickers', 'High-quality 4x4 square stickers printed on premium vinyl.', 29, '0.32', 1, true, false, false, 1200, 1200, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (295, '4x5 Square Stickers', '4x5-square-stickers', 'High-quality 4x5 square stickers printed on premium vinyl.', 29, '0.37', 1, true, false, false, 1200, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (296, '4x6 Square Stickers', '4x6-square-stickers', 'High-quality 4x6 square stickers printed on premium vinyl.', 29, '0.43', 1, true, false, false, 1200, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (297, '5x5 Square Stickers', '5x5-square-stickers', 'High-quality 5x5 square stickers printed on premium vinyl.', 29, '0.44', 1, true, false, false, 1500, 1500, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (298, '5x6 Square Stickers', '5x6-square-stickers', 'High-quality 5x6 square stickers printed on premium vinyl.', 29, '0.50', 1, true, false, false, 1500, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO products (id, name, slug, description, category_id, base_price, min_quantity, is_active, is_featured, use_global_tiers, template_width, template_height, supports_custom_shape, shipping_type) 
VALUES (299, '6x6 Square Stickers', '6x6-square-stickers', 'High-quality 6x6 square stickers printed on premium vinyl.', 29, '0.58', 1, true, false, false, 1800, 1800, false, 'calculated') 
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));

-- Product Options (Materials, Coatings, Cuts)
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2440, 268, 'material', 'Vinyl', 'vinyl', '0.03', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2441, 268, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2442, 268, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2443, 268, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2444, 268, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2445, 268, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2446, 268, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2447, 268, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2448, 268, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2449, 269, 'material', 'Vinyl', 'vinyl', '0.04', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2450, 269, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2451, 269, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2452, 269, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2453, 269, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2454, 269, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2455, 269, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2456, 269, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2457, 269, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2458, 270, 'material', 'Vinyl', 'vinyl', '0.06', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2459, 270, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2460, 270, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2461, 270, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2462, 270, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2463, 270, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2464, 270, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2465, 270, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2466, 270, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2467, 271, 'material', 'Vinyl', 'vinyl', '0.07', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2468, 271, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2469, 271, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2470, 271, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2471, 271, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2472, 271, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2473, 271, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2474, 271, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2475, 271, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2476, 272, 'material', 'Vinyl', 'vinyl', '0.09', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2477, 272, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2478, 272, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2479, 272, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2480, 272, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2481, 272, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2482, 272, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2483, 272, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2484, 272, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2485, 273, 'material', 'Vinyl', 'vinyl', '0.10', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2486, 273, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2487, 273, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2488, 273, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2489, 273, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2490, 273, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2491, 273, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2492, 273, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2493, 273, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2494, 274, 'material', 'Vinyl', 'vinyl', '0.12', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2495, 274, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2496, 274, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2497, 274, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2498, 274, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2499, 274, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2500, 274, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2501, 274, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2502, 274, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2503, 275, 'material', 'Vinyl', 'vinyl', '0.13', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2504, 275, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2505, 275, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2506, 275, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2507, 275, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2508, 275, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2509, 275, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2510, 275, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2511, 275, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2512, 276, 'material', 'Vinyl', 'vinyl', '0.15', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2513, 276, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2514, 276, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2515, 276, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2516, 276, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2517, 276, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2518, 276, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2519, 276, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2520, 276, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2521, 277, 'material', 'Vinyl', 'vinyl', '0.16', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2522, 277, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2523, 277, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2524, 277, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2525, 277, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2526, 277, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2527, 277, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2528, 277, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2529, 277, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2530, 278, 'material', 'Vinyl', 'vinyl', '0.18', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2531, 278, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2532, 278, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2533, 278, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2534, 278, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2535, 278, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2536, 278, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2537, 278, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2538, 278, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2539, 279, 'material', 'Vinyl', 'vinyl', '0.02', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2540, 279, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2541, 279, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2542, 279, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2543, 279, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2544, 279, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2545, 279, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2546, 279, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2547, 279, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2548, 280, 'material', 'Vinyl', 'vinyl', '0.03', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2549, 280, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2550, 280, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2551, 280, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2552, 280, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2553, 280, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2554, 280, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2555, 280, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2556, 280, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2557, 281, 'material', 'Vinyl', 'vinyl', '0.05', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2558, 281, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2559, 281, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2560, 281, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2561, 281, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2562, 281, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2563, 281, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2564, 281, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2565, 281, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2566, 282, 'material', 'Vinyl', 'vinyl', '0.08', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2567, 282, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2568, 282, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2569, 282, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2570, 282, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2571, 282, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2572, 282, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2573, 282, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2574, 282, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2575, 283, 'material', 'Vinyl', 'vinyl', '0.10', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2576, 283, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2577, 283, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2578, 283, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2579, 283, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2580, 283, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2581, 283, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2582, 283, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2583, 283, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2584, 284, 'material', 'Vinyl', 'vinyl', '0.11', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2585, 284, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2586, 284, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2587, 284, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2588, 284, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2589, 284, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2590, 284, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2591, 284, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2592, 284, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2593, 285, 'material', 'Vinyl', 'vinyl', '0.03', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2594, 285, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2595, 285, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2596, 285, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2597, 285, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2598, 285, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2599, 285, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2600, 285, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2601, 285, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2602, 286, 'material', 'Vinyl', 'vinyl', '0.06', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2603, 286, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2604, 286, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2605, 286, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2606, 286, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2607, 286, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2608, 286, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2609, 286, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2610, 286, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2611, 287, 'material', 'Vinyl', 'vinyl', '0.12', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2612, 287, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2613, 287, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2614, 287, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2615, 287, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2616, 287, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2617, 287, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2618, 287, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2619, 287, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2620, 288, 'material', 'Vinyl', 'vinyl', '0.22', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2621, 288, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2622, 288, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2623, 288, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2624, 288, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2625, 288, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2626, 288, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2627, 288, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2628, 288, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2629, 289, 'material', 'Vinyl', 'vinyl', '0.12', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2630, 289, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2631, 289, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2632, 289, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2633, 289, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2634, 289, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2635, 289, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2636, 289, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2637, 289, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2638, 290, 'material', 'Vinyl', 'vinyl', '0.11', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2639, 290, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2640, 290, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2641, 290, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2642, 290, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2643, 290, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2644, 290, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2645, 290, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2646, 290, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2647, 291, 'material', 'Vinyl', 'vinyl', '0.16', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2648, 291, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2649, 291, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2650, 291, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2651, 291, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2652, 291, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2653, 291, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2654, 291, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2655, 291, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2656, 292, 'material', 'Vinyl', 'vinyl', '0.28', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2657, 292, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2658, 292, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2659, 292, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2660, 292, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2661, 292, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2662, 292, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2663, 292, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2664, 292, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2665, 293, 'material', 'Vinyl', 'vinyl', '0.34', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2666, 293, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2667, 293, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2668, 293, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2669, 293, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2670, 293, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2671, 293, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2672, 293, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2673, 293, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2674, 294, 'material', 'Vinyl', 'vinyl', '0.22', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2675, 294, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2676, 294, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2677, 294, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2678, 294, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2679, 294, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2680, 294, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2681, 294, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2682, 294, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2683, 295, 'material', 'Vinyl', 'vinyl', '0.28', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2684, 295, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2685, 295, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2686, 295, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2687, 295, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2688, 295, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2689, 295, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2690, 295, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2691, 295, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2692, 296, 'material', 'Vinyl', 'vinyl', '0.46', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2693, 296, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2694, 296, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2695, 296, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2696, 296, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2697, 296, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2698, 296, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2699, 296, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2700, 296, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2701, 297, 'material', 'Vinyl', 'vinyl', '0.34', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2702, 297, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2703, 297, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2704, 297, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2705, 297, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2706, 297, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2707, 297, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2708, 297, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2709, 297, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2710, 298, 'material', 'Vinyl', 'vinyl', '0.55', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2711, 298, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2712, 298, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2713, 298, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2714, 298, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2715, 298, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2716, 298, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2717, 298, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2718, 298, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2719, 299, 'material', 'Vinyl', 'vinyl', '0.66', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2720, 299, 'material', 'Foil', 'foil', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2721, 299, 'material', 'Holographic', 'holographic', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2722, 299, 'coating', 'None', 'none', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2723, 299, 'coating', 'Varnish', 'varnish', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2724, 299, 'coating', 'Emboss', 'emboss', '0.00', NULL, NULL, NULL, false, true, 3) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2725, 299, 'coating', 'Both', 'both', '0.00', NULL, NULL, NULL, false, true, 4) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2726, 299, 'cut', 'Standard', 'Kiss cut', '0.00', NULL, NULL, NULL, true, true, 1) 
ON CONFLICT (id) DO NOTHING;
INSERT INTO product_options (id, product_id, option_type, name, value, price_modifier, tier2_price_modifier, tier3_price_modifier, tier4_price_modifier, is_default, is_active, display_order) 
VALUES (2727, 299, 'cut', 'Die Cut', 'Die cut', '0.00', NULL, NULL, NULL, false, true, 2) 
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('product_options_id_seq', COALESCE((SELECT MAX(id) FROM product_options), 1));

-- Pricing Tiers
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (455, 268, 1, 249, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (456, 268, 250, 999, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (457, 268, 1000, 1999, '0.1000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (458, 268, 2000, 5000, '0.0800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (459, 269, 1, 249, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (460, 269, 250, 999, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (461, 269, 1000, 1999, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (462, 269, 2000, 5000, '0.0900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (463, 270, 1, 249, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (464, 270, 250, 999, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (465, 270, 1000, 1999, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (466, 270, 2000, 5000, '0.0900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (467, 271, 1, 249, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (468, 271, 250, 999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (469, 271, 1000, 1999, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (470, 271, 2000, 5000, '0.1000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (471, 272, 1, 249, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (472, 272, 250, 999, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (473, 272, 1000, 1999, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (474, 272, 2000, 5000, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (475, 273, 1, 249, '0.1800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (476, 273, 250, 999, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (477, 273, 1000, 1999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (478, 273, 2000, 5000, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (479, 274, 1, 249, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (480, 274, 250, 999, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (481, 274, 1000, 1999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (482, 274, 2000, 5000, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (483, 275, 1, 249, '0.2000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (484, 275, 250, 999, '0.1800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (485, 275, 1000, 1999, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (486, 275, 2000, 5000, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (487, 276, 1, 249, '0.2100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (488, 276, 250, 999, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (489, 276, 1000, 1999, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (490, 276, 2000, 5000, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (491, 277, 1, 249, '0.2200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (492, 277, 250, 999, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (493, 277, 1000, 1999, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (494, 277, 2000, 5000, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (495, 278, 1, 249, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (496, 278, 250, 999, '0.2000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (497, 278, 1000, 1999, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (498, 278, 2000, 5000, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (499, 279, 1, 249, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (500, 279, 250, 999, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (501, 279, 1000, 1999, '0.0900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (502, 279, 2000, 5000, '0.0800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (503, 280, 1, 249, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (504, 280, 250, 999, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (505, 280, 1000, 1999, '0.1000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (506, 280, 2000, 5000, '0.0800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (507, 281, 1, 249, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (508, 281, 250, 999, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (509, 281, 1000, 1999, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (510, 281, 2000, 5000, '0.0900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (511, 282, 1, 249, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (512, 282, 250, 999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (513, 282, 1000, 1999, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (514, 282, 2000, 5000, '0.1000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (515, 283, 1, 249, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (516, 283, 250, 999, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (517, 283, 1000, 1999, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (518, 283, 2000, 5000, '0.1100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (519, 284, 1, 249, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (520, 284, 250, 999, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (521, 284, 1000, 1999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (522, 284, 2000, 5000, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (523, 285, 1, 249, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (524, 285, 250, 999, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (525, 285, 1000, 1999, '0.1200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (526, 285, 2000, 5000, '0.1000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (527, 286, 1, 249, '0.2100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (528, 286, 250, 999, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (529, 286, 1000, 1999, '0.1600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (530, 286, 2000, 5000, '0.1300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (531, 287, 1, 249, '0.2400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (532, 287, 250, 999, '0.2100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (533, 287, 1000, 1999, '0.1800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (534, 287, 2000, 5000, '0.1500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (535, 288, 1, 249, '0.2700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (536, 288, 250, 999, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (537, 288, 1000, 1999, '0.2000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (538, 288, 2000, 5000, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (539, 289, 1, 249, '0.3000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (540, 289, 250, 999, '0.2600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (541, 289, 1000, 1999, '0.2200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (542, 289, 2000, 5000, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (543, 290, 1, 249, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (544, 290, 250, 999, '0.2000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (545, 290, 1000, 1999, '0.1700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (546, 290, 2000, 5000, '0.1400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (547, 291, 1, 249, '0.2700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (548, 291, 250, 999, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (549, 291, 1000, 1999, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (550, 291, 2000, 5000, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (551, 292, 1, 249, '0.3000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (552, 292, 250, 999, '0.2700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (553, 292, 1000, 1999, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (554, 292, 2000, 5000, '0.1900') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (555, 293, 1, 249, '0.3400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (556, 293, 250, 999, '0.3000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (557, 293, 1000, 1999, '0.2600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (558, 293, 2000, 5000, '0.2100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (559, 294, 1, 249, '0.3200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (560, 294, 250, 999, '0.2800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (561, 294, 1000, 1999, '0.2400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (562, 294, 2000, 5000, '0.2000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (563, 295, 1, 249, '0.3700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (564, 295, 250, 999, '0.3200') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (565, 295, 1000, 1999, '0.2800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (566, 295, 2000, 5000, '0.2300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (567, 296, 1, 249, '0.4300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (568, 296, 250, 999, '0.3600') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (569, 296, 1000, 1999, '0.3000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (570, 296, 2000, 5000, '0.2500') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (571, 297, 1, 249, '0.4400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (572, 297, 250, 999, '0.3800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (573, 297, 1000, 1999, '0.3100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (574, 297, 2000, 5000, '0.2700') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (575, 298, 1, 249, '0.5000') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (576, 298, 250, 999, '0.4400') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (577, 298, 1000, 1999, '0.3800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (578, 298, 2000, 5000, '0.3100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (579, 299, 1, 249, '0.5800') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (580, 299, 250, 999, '0.5100') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (581, 299, 1000, 1999, '0.4300') 
ON CONFLICT (id) DO NOTHING;
INSERT INTO pricing_tiers (id, product_id, min_quantity, max_quantity, price_per_unit) 
VALUES (582, 299, 2000, 5000, '0.3600') 
ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT setval('pricing_tiers_id_seq', COALESCE((SELECT MAX(id) FROM pricing_tiers), 1));

-- Done!

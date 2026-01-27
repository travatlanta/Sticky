export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Transform snake_case to camelCase for frontend compatibility
const transformProduct = (p: any) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  categoryId: p.category_id,
  basePrice: p.base_price,
  thumbnailUrl: p.thumbnail_url,
  minQuantity: p.min_quantity,
  isActive: p.is_active,
  isFeatured: p.is_featured,
  isDealProduct: p.is_deal_product,
  fixedPrice: p.fixed_price,
  fixedQuantity: p.fixed_quantity,
  templateWidth: p.template_width,
  templateHeight: p.template_height,
  printWidthInches: p.print_width_inches,
  printHeightInches: p.print_height_inches,
  printDpi: p.print_dpi,
  bleedSize: p.bleed_size,
  safeZoneSize: p.safe_zone_size,
  supportsCustomShape: p.supports_custom_shape,
  useGlobalTiers: p.use_global_tiers,
  shippingType: p.shipping_type,
  flatShippingPrice: p.flat_shipping_price,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

const transformOption = (o: any) => ({
  id: o.id,
  productId: o.product_id,
  optionGroup: o.option_group,
  optionName: o.option_name,
  priceModifier: o.price_modifier,
  isDefault: o.is_default,
  displayOrder: o.display_order,
  tier1Price: o.tier1_price,
  tier2Price: o.tier2_price,
  tier3Price: o.tier3_price,
  tier4Price: o.tier4_price,
});

const transformTier = (t: any) => ({
  id: t.id,
  productId: t.product_id,
  minQuantity: t.min_quantity,
  maxQuantity: t.max_quantity,
  pricePerUnit: t.price_per_unit,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Use raw SQL to ensure fresh data directly from database
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if slug is numeric (productId) or string (actual slug)
    const isNumeric = /^\d+$/.test(slug);
    
    let product;
    if (isNumeric) {
      const result = await sql`SELECT * FROM products WHERE id = ${parseInt(slug)}`;
      product = result[0];
    } else {
      const result = await sql`SELECT * FROM products WHERE slug = ${slug}`;
      product = result[0];
    }

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Transform product to camelCase
    const transformedProduct = transformProduct(product);

    // Get product options using raw SQL
    const optionsResult = await sql`
      SELECT * FROM product_options 
      WHERE product_id = ${product.id} 
      ORDER BY display_order ASC
    `;
    const options = optionsResult.map(transformOption);

    // Get pricing tiers using raw SQL
    const tiersResult = await sql`
      SELECT * FROM pricing_tiers 
      WHERE product_id = ${product.id} 
      ORDER BY min_quantity ASC
    `;
    const tiers = tiersResult.map(transformTier);

    // Log for debugging
    console.log(`[Product Detail] Fetched product ${product.id}: thumbnailUrl=${transformedProduct.thumbnailUrl ? 'YES' : 'NO'}`);

    return NextResponse.json({ ...transformedProduct, options, pricingTiers: tiers }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
  }
}

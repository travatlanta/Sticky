export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { pricingTiers } from '@shared/schema';
import { asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');

    // Use raw SQL query to bypass any ORM caching
    const sql = neon(process.env.DATABASE_URL!);
    const timestamp = Date.now();
    
    // Debug: Log database connection status
    console.log('[Products API] Raw SQL query, timestamp:', timestamp);

    // Use raw SQL to get fresh data - bypassing Drizzle ORM entirely
    const rawProducts = await sql`SELECT * FROM products WHERE ${timestamp} = ${timestamp}`;
    const allProducts = rawProducts as any[];
    console.log('[Products API] Total products in DB:', allProducts.length);
    
    // Filter in JavaScript - raw SQL returns snake_case column names
    let result = allProducts.filter(p => p.is_active === true);
    console.log('[Products API] After isActive filter:', result.length);
    
    if (categoryId) {
      result = result.filter(p => p.category_id === parseInt(categoryId));
      console.log('[Products API] After category filter:', result.length);
    }

    if (featured === 'true') {
      result = result.filter(p => p.is_featured === true);
      console.log('[Products API] After featured filter:', result.length);
    }

    // Debug: Log query results with sample data (raw SQL uses snake_case)
    console.log('[Products API] Query returned', result.length, 'products');
    // Log ALL products with thumbnails to debug update issue
    const withThumbnails = result.filter(p => p.thumbnail_url);
    console.log(`[Products API] Products WITH thumbnails: ${withThumbnails.length}`);
    withThumbnails.forEach((p) => {
      console.log(`[Products API] HAS THUMB: id=${p.id}, name=${p.name}, url=${p.thumbnail_url?.substring(0, 50)}`);
    });
    const withoutThumbnails = result.filter(p => !p.thumbnail_url).slice(0, 5);
    console.log(`[Products API] Sample NO THUMB: ${withoutThumbnails.map(p => `${p.id}:${p.name}`).join(', ')}`);

    // Fetch pricing tiers for all products to calculate display prices using raw SQL
    const rawTiers = await sql`SELECT * FROM pricing_tiers ORDER BY min_quantity ASC`;
    const allTiers = rawTiers as any[];
    
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

    // Calculate the display price (lowest tier price for minimum quantity)
    const productsWithDisplayPrice = result.map(product => {
      const transformed = transformProduct(product);
      
      // For deal products, use fixedPrice / fixedQuantity
      if (transformed.isDealProduct && transformed.fixedPrice && transformed.fixedQuantity) {
        const displayPrice = parseFloat(transformed.fixedPrice) / transformed.fixedQuantity;
        return { ...transformed, displayPricePerUnit: displayPrice.toFixed(2) };
      }
      
      // Find tiers for this product
      const productTiers = allTiers.filter((t: any) => t.product_id === product.id);
      
      // Get the tier for minimum quantity
      const minQty = transformed.minQuantity || 1;
      let displayPrice = parseFloat(transformed.basePrice || '0');
      
      for (const tier of productTiers) {
        if (minQty >= tier.min_quantity && (!tier.max_quantity || minQty <= tier.max_quantity)) {
          displayPrice = parseFloat(tier.price_per_unit);
          break;
        }
      }
      
      return { ...transformed, displayPricePerUnit: displayPrice.toFixed(2) };
    });

    // Return with aggressive cache control headers to ensure fresh data
    // Including Vercel-specific headers to bypass CDN caching
    return NextResponse.json(productsWithDisplayPrice, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Failed to fetch products', 
      error: errorMessage,
      hasDbUrl: !!process.env.DATABASE_URL 
    }, { status: 500 });
  }
}

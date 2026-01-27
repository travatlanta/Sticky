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
    
    // Calculate the display price (lowest tier price for minimum quantity)
    // Note: Raw SQL returns snake_case column names
    const productsWithDisplayPrice = result.map(product => {
      // For deal products, use fixedPrice / fixedQuantity (snake_case from raw SQL)
      const isDeal = product.is_deal_product || product.isDealProduct;
      const fixedPrice = product.fixed_price || product.fixedPrice;
      const fixedQty = product.fixed_quantity || product.fixedQuantity;
      
      if (isDeal && fixedPrice && fixedQty) {
        const displayPrice = parseFloat(fixedPrice) / fixedQty;
        return { ...product, displayPricePerUnit: displayPrice.toFixed(2) };
      }
      
      // Find tiers for this product (raw SQL uses snake_case: product_id)
      const productTiers = allTiers.filter((t: any) => t.product_id === product.id);
      
      // Get the tier for minimum quantity (snake_case: min_quantity)
      const minQty = product.min_quantity || product.minQuantity || 1;
      const basePrice = product.base_price || product.basePrice || '0';
      let displayPrice = parseFloat(basePrice);
      
      for (const tier of productTiers) {
        const tierMin = tier.min_quantity;
        const tierMax = tier.max_quantity;
        const tierPrice = tier.price_per_unit;
        if (minQty >= tierMin && (!tierMax || minQty <= tierMax)) {
          displayPrice = parseFloat(tierPrice);
          break;
        }
      }
      
      return { ...product, displayPricePerUnit: displayPrice.toFixed(2) };
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

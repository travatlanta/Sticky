export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, pricingTiers } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from '@shared/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');

    // Create a fresh database connection for each request to avoid stale reads
    const sql = neon(process.env.DATABASE_URL!);
    const freshDb = drizzle(sql as any, { schema });
    
    // Debug: Log database connection status
    console.log('[Products API] Fresh connection created, timestamp:', Date.now());

    // Get all products first, then filter in JavaScript
    const allProducts = await freshDb.select().from(products);
    console.log('[Products API] Total products in DB:', allProducts.length);
    
    // Filter in JavaScript instead of SQL to debug the issue
    let result = allProducts.filter(p => p.isActive === true);
    console.log('[Products API] After isActive filter:', result.length);
    
    if (categoryId) {
      result = result.filter(p => p.categoryId === parseInt(categoryId));
      console.log('[Products API] After category filter:', result.length);
    }

    if (featured === 'true') {
      result = result.filter(p => p.isFeatured === true);
      console.log('[Products API] After featured filter:', result.length);
    }

    // Debug: Log query results with sample data
    console.log('[Products API] Query returned', result.length, 'products');
    // Log ALL products with thumbnails to debug update issue
    const withThumbnails = result.filter(p => p.thumbnailUrl);
    console.log(`[Products API] Products WITH thumbnails: ${withThumbnails.length}`);
    withThumbnails.forEach((p) => {
      console.log(`[Products API] HAS THUMB: id=${p.id}, name=${p.name}, url=${p.thumbnailUrl?.substring(0, 50)}`);
    });
    const withoutThumbnails = result.filter(p => !p.thumbnailUrl).slice(0, 5);
    console.log(`[Products API] Sample NO THUMB: ${withoutThumbnails.map(p => `${p.id}:${p.name}`).join(', ')}`);

    // Fetch pricing tiers for all products to calculate display prices
    const allTiers = await freshDb
      .select()
      .from(pricingTiers)
      .orderBy(asc(pricingTiers.minQuantity));
    
    // Calculate the display price (lowest tier price for minimum quantity)
    const productsWithDisplayPrice = result.map(product => {
      // For deal products, use fixedPrice / fixedQuantity
      if (product.isDealProduct && product.fixedPrice && product.fixedQuantity) {
        const displayPrice = parseFloat(product.fixedPrice) / product.fixedQuantity;
        return { ...product, displayPricePerUnit: displayPrice.toFixed(2) };
      }
      
      // Find tiers for this product
      const productTiers = allTiers.filter(t => t.productId === product.id);
      
      // Get the tier for minimum quantity
      const minQty = product.minQuantity || 1;
      let displayPrice = parseFloat(product.basePrice);
      
      for (const tier of productTiers) {
        if (minQty >= tier.minQuantity && (!tier.maxQuantity || minQty <= tier.maxQuantity)) {
          displayPrice = parseFloat(tier.pricePerUnit);
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

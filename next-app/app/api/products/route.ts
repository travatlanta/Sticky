export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, pricingTiers } from '@shared/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');

    // Debug: Log database connection status
    console.log('[Products API] Starting query, DATABASE_URL exists:', !!process.env.DATABASE_URL);

    let conditions = [eq(products.isActive, true)];

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    const result = await db
      .select()
      .from(products)
      .where(and(...conditions));

    // Debug: Log query results
    console.log('[Products API] Query returned', result.length, 'products');

    // Fetch pricing tiers for all products to calculate display prices
    const allTiers = await db
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

    // Return with cache control headers to ensure fresh data
    return NextResponse.json(productsWithDisplayPrice, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
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

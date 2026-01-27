export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, productOptions, pricingTiers } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import * as schema from '@shared/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Create a fresh database connection for each request to avoid stale reads
    const sql = neon(process.env.DATABASE_URL!);
    const freshDb = drizzle(sql as any, { schema });
    
    // Check if slug is numeric (productId) or string (actual slug)
    const isNumeric = /^\d+$/.test(slug);
    
    const [product] = await freshDb
      .select()
      .from(products)
      .where(isNumeric ? eq(products.id, parseInt(slug)) : eq(products.slug, slug));

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Get product options
    const options = await freshDb
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.displayOrder));

    // Get pricing tiers
    const tiers = await freshDb
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, product.id))
      .orderBy(asc(pricingTiers.minQuantity));

    return NextResponse.json({ ...product, options, pricingTiers: tiers }, {
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

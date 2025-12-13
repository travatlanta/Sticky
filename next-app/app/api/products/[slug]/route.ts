import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Check if slug is numeric (productId) or string (actual slug)
    const isNumeric = /^\d+$/.test(slug);
    
    const [product] = await db
      .select()
      .from(products)
      .where(isNumeric ? eq(products.id, parseInt(slug)) : eq(products.slug, slug));

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Get product options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, product.id))
      .orderBy(asc(productOptions.displayOrder));

    // Get pricing tiers
    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, product.id))
      .orderBy(asc(pricingTiers.minQuantity));

    return NextResponse.json({ ...product, options, pricingTiers: tiers });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
  }
}

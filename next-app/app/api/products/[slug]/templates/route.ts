export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productTemplates } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Check if slug is numeric (productId) or string (actual slug)
    const isNumeric = /^\d+$/.test(slug);
    
    // Find product first
    const [product] = await db
      .select()
      .from(products)
      .where(isNumeric ? eq(products.id, parseInt(slug)) : eq(products.slug, slug));

    if (!product) {
      return NextResponse.json([]);
    }

    // Get active templates for this product
    const templates = await db
      .select()
      .from(productTemplates)
      .where(and(
        eq(productTemplates.productId, product.id),
        eq(productTemplates.isActive, true)
      ));

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json([]);
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { adjustmentType, adjustmentValue, categoryId, preview } = body;

    if (!adjustmentType || adjustmentValue === undefined || adjustmentValue === null) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // For bulk price adjustment, update ALL products (both active and inactive)
    // Only filter by category if specified
    let productsToAdjust;
    if (categoryId !== null && categoryId !== undefined) {
      productsToAdjust = await db
        .select()
        .from(products)
        .where(eq(products.categoryId, categoryId));
    } else {
      productsToAdjust = await db
        .select()
        .from(products);
    }

    const adjustedProducts = productsToAdjust.map(product => {
      const currentPrice = parseFloat(product.basePrice);
      let newPrice: number;

      if (adjustmentType === 'percentage') {
        newPrice = currentPrice * (1 + adjustmentValue / 100);
      } else {
        newPrice = currentPrice + adjustmentValue;
      }

      newPrice = Math.max(0, newPrice);
      newPrice = Math.round(newPrice * 10000) / 10000;

      return {
        id: product.id,
        name: product.name,
        oldPrice: product.basePrice,
        newPrice: newPrice.toFixed(4),
      };
    });

    if (preview) {
      return NextResponse.json({ products: adjustedProducts });
    }

    let updatedCount = 0;
    for (const adjusted of adjustedProducts) {
      await db
        .update(products)
        .set({ 
          basePrice: adjusted.newPrice,
          updatedAt: new Date(),
        })
        .where(eq(products.id, adjusted.id));
      updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount,
      products: adjustedProducts,
    });
  } catch (error) {
    console.error('Error adjusting prices:', error);
    return NextResponse.json({ message: 'Failed to adjust prices' }, { status: 500 });
  }
}

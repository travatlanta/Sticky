import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const featured = searchParams.get('featured');

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allProducts = await db.select().from(products);
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const [product] = await db
      .insert(products)
      .values({
        name: body.name,
        slug: slug,
        description: body.description,
        categoryId: body.categoryId,
        basePrice: body.basePrice,
        thumbnailUrl: body.thumbnailUrl,
        minQuantity: body.minQuantity || 1,
        isActive: body.isActive ?? true,
        isFeatured: body.isFeatured ?? false,
        templateWidth: body.templateWidth || 300,
        templateHeight: body.templateHeight || 300,
        bleedSize: body.bleedSize || '0.125',
        safeZoneSize: body.safeZoneSize || '0.25',
        supportsCustomShape: body.supportsCustomShape || false,
      })
      .returning();

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Failed to create product' }, { status: 500 });
  }
}

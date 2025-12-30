export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productOptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId));

    const materials = options.filter(o => o.optionType === 'material');
    const coatings = options.filter(o => o.optionType === 'coating');

    return NextResponse.json({ materials, coatings });
  } catch (error) {
    console.error('Error fetching product options:', error);
    return NextResponse.json({ message: 'Failed to fetch options' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    const { materials, coatings } = body;

    if (materials && Array.isArray(materials)) {
      for (const mat of materials) {
        if (mat.id) {
          await db
            .update(productOptions)
            .set({ priceModifier: mat.priceModifier || '0.00' })
            .where(and(
              eq(productOptions.id, mat.id),
              eq(productOptions.productId, productId)
            ));
        }
      }
    }

    if (coatings && Array.isArray(coatings)) {
      for (const coat of coatings) {
        if (coat.id) {
          await db
            .update(productOptions)
            .set({ priceModifier: coat.priceModifier || '0.00' })
            .where(and(
              eq(productOptions.id, coat.id),
              eq(productOptions.productId, productId)
            ));
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product options:', error);
    return NextResponse.json({ message: 'Failed to update options' }, { status: 500 });
  }
}

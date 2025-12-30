export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pricingTiers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);

    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, productId))
      .orderBy(pricingTiers.minQuantity);

    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return NextResponse.json({ message: 'Failed to fetch pricing tiers' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    const { tiers } = body;

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ message: 'Invalid tiers format' }, { status: 400 });
    }

    await db.delete(pricingTiers).where(eq(pricingTiers.productId, productId));

    const validTiers = tiers.filter(t => 
      t.minQuantity && t.minQuantity > 0 && 
      t.pricePerUnit && parseFloat(t.pricePerUnit) > 0
    );

    if (validTiers.length > 0) {
      await db.insert(pricingTiers).values(
        validTiers.map((tier, index) => ({
          productId,
          minQuantity: parseInt(tier.minQuantity),
          maxQuantity: tier.maxQuantity ? parseInt(tier.maxQuantity) : null,
          pricePerUnit: tier.pricePerUnit.toString(),
        }))
      );
    }

    const updatedTiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, productId))
      .orderBy(pricingTiers.minQuantity);

    return NextResponse.json(updatedTiers);
  } catch (error) {
    console.error('Error updating pricing tiers:', error);
    return NextResponse.json({ message: 'Failed to update pricing tiers' }, { status: 500 });
  }
}

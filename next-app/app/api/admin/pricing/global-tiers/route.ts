export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { globalPricingTiers } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const tiers = await db
      .select()
      .from(globalPricingTiers)
      .orderBy(globalPricingTiers.tierNumber);

    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching global tiers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tiers } = body;

    if (!Array.isArray(tiers)) {
      return NextResponse.json({ message: 'Invalid tiers data' }, { status: 400 });
    }

    for (const tier of tiers) {
      const { tierNumber, minQuantity, maxQuantity, discountPercent, isActive } = tier;
      
      if (!tierNumber || !minQuantity || discountPercent === undefined) {
        continue;
      }

      await db
        .update(globalPricingTiers)
        .set({
          minQuantity: parseInt(minQuantity),
          maxQuantity: maxQuantity ? parseInt(maxQuantity) : null,
          discountPercent: parseFloat(discountPercent).toFixed(2),
          isActive: isActive !== false,
        })
        .where(eq(globalPricingTiers.tierNumber, tierNumber));
    }

    const updatedTiers = await db
      .select()
      .from(globalPricingTiers)
      .orderBy(globalPricingTiers.tierNumber);

    return NextResponse.json({ 
      message: 'Global tiers updated successfully',
      tiers: updatedTiers 
    });
  } catch (error) {
    console.error('Error updating global tiers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

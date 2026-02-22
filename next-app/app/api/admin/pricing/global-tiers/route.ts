export const dynamic = "force-dynamic";
import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { globalPricingTiers } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DEFAULT_SURCHARGE_TIERS = [
  { minQuantity: 1, maxQuantity: 99 },
  { minQuantity: 100, maxQuantity: 999 },
];

function normalizePercent(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '0.00';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return '0.00';
  return parsed.toFixed(2);
}

function isSurchargeRange(minQuantity: number, maxQuantity: number | null): boolean {
  return minQuantity >= 1 && minQuantity <= 999 && (maxQuantity === null || maxQuantity <= 999);
}

async function ensureSurchargeTiersExist() {
  const tiers = await db
    .select()
    .from(globalPricingTiers)
    .orderBy(asc(globalPricingTiers.tierNumber));

  let nextTierNumber = tiers.reduce((max, tier) => Math.max(max, tier.tierNumber), 0) + 1;

  for (const target of DEFAULT_SURCHARGE_TIERS) {
    const exists = tiers.some(
      (tier) => tier.minQuantity === target.minQuantity && (tier.maxQuantity ?? null) === target.maxQuantity
    );

    if (!exists) {
      await db.insert(globalPricingTiers).values({
        tierNumber: nextTierNumber,
        minQuantity: target.minQuantity,
        maxQuantity: target.maxQuantity,
        discountPercent: '0.00',
        isActive: false,
      });
      nextTierNumber += 1;
    }
  }
}

async function readOrderedTiers() {
  return db
    .select()
    .from(globalPricingTiers)
    .orderBy(asc(globalPricingTiers.minQuantity));
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await ensureSurchargeTiersExist();
    const tiers = await readOrderedTiers();

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
      const tierNumber = Number(tier?.tierNumber);
      const minQuantity = Number(tier?.minQuantity);
      const maxQuantity = tier?.maxQuantity === null || tier?.maxQuantity === '' || tier?.maxQuantity === undefined
        ? null
        : Number(tier.maxQuantity);

      if (!Number.isInteger(tierNumber) || !Number.isInteger(minQuantity) || minQuantity < 1) {
        continue;
      }

      if (maxQuantity !== null && (!Number.isInteger(maxQuantity) || maxQuantity < minQuantity)) {
        return NextResponse.json({ message: `Invalid maxQuantity for tier ${tierNumber}` }, { status: 400 });
      }

      const percent = normalizePercent(tier?.discountPercent);
      const explicitActive = tier?.isActive === true;
      const isSurchargeTier = isSurchargeRange(minQuantity, maxQuantity);
      const hasConfiguredPercent = Number(percent) > 0;

      const targetActive = isSurchargeTier
        ? explicitActive && hasConfiguredPercent
        : tier?.isActive !== false;

      const existing = await db
        .select({ id: globalPricingTiers.id })
        .from(globalPricingTiers)
        .where(eq(globalPricingTiers.tierNumber, tierNumber))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(globalPricingTiers)
          .set({
            minQuantity,
            maxQuantity,
            discountPercent: percent,
            isActive: targetActive,
          })
          .where(eq(globalPricingTiers.tierNumber, tierNumber));
      } else {
        await db.insert(globalPricingTiers).values({
          tierNumber,
          minQuantity,
          maxQuantity,
          discountPercent: percent,
          isActive: targetActive,
        });
      }
    }

    await ensureSurchargeTiersExist();
    const updatedTiers = await readOrderedTiers();

    return NextResponse.json({ 
      message: 'Global tiers updated successfully',
      tiers: updatedTiers 
    });
  } catch (error) {
    console.error('Error updating global tiers:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

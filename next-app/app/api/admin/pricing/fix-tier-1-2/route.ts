export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, pricingTiers } from '@shared/schema';
import { and, asc, eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const allProducts = await db.select().from(products).orderBy(asc(products.id));
    const results: { slug: string; tier3: string; tier2: string; tier1: string }[] = [];
    let skipped = 0;

    for (const product of allProducts) {
      const tier3Rows = await db
        .select()
        .from(pricingTiers)
        .where(and(eq(pricingTiers.productId, product.id), eq(pricingTiers.minQuantity, 250)))
        .limit(1);

      if (tier3Rows.length === 0) {
        skipped++;
        continue;
      }

      const base = Number(tier3Rows[0].pricePerUnit);
      if (!Number.isFinite(base) || base <= 0) {
        skipped++;
        continue;
      }

      const tier2 = Math.round(base * 2.5 * 100) / 100;
      const tier1 = Math.round(tier2 * 2.5 * 100) / 100;

      await db
        .update(pricingTiers)
        .set({ pricePerUnit: tier2.toFixed(2) })
        .where(and(eq(pricingTiers.productId, product.id), eq(pricingTiers.minQuantity, 100)));

      await db
        .update(pricingTiers)
        .set({ pricePerUnit: tier1.toFixed(2) })
        .where(and(eq(pricingTiers.productId, product.id), eq(pricingTiers.minQuantity, 1)));

      results.push({
        slug: product.slug,
        tier3: base.toFixed(4),
        tier2: tier2.toFixed(2),
        tier1: tier1.toFixed(2),
      });
    }

    return NextResponse.json({ updated: results.length, skipped, results });
  } catch (error) {
    console.error('fix-tier-1-2 error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

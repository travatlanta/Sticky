/**
 * fix-tier-1-2-pricing.ts
 *
 * For every product, reads the existing tier-3 (250–999) price from the DB and
 * recomputes tier-2 (100–249) and tier-1 (1–99) using the correct multipliers:
 *   tier2 = round(tier3 × 2.5, 2)
 *   tier1 = round(tier2 × 2.5, 2)
 *
 * Tiers 4–6 are left completely untouched.
 *
 * Run with:
 *   npx tsx scripts/fix-tier-1-2-pricing.ts
 */

import { db } from '../lib/db';
import { products, pricingTiers } from '../shared/schema';
import { and, asc, eq } from 'drizzle-orm';

async function main() {
  console.log('Fixing tier-1 and tier-2 prices for all products...\n');

  const allProducts = await db.select().from(products).orderBy(asc(products.id));
  let updated = 0;
  let skipped = 0;

  for (const product of allProducts) {
    const tier3Row = await db
      .select()
      .from(pricingTiers)
      .where(and(eq(pricingTiers.productId, product.id), eq(pricingTiers.minQuantity, 250)))
      .limit(1);

    if (tier3Row.length === 0) {
      console.log(`⚠️  No tier-3 row found for: ${product.slug} — skipping`);
      skipped++;
      continue;
    }

    const base = Number(tier3Row[0].pricePerUnit);

    if (!Number.isFinite(base) || base <= 0) {
      console.log(`⚠️  Invalid tier-3 price (${tier3Row[0].pricePerUnit}) for: ${product.slug} — skipping`);
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

    console.log(
      `✅ ${product.slug.padEnd(40)} tier3=$${base.toFixed(4)}  →  tier2=$${tier2.toFixed(2)}  tier1=$${tier1.toFixed(2)}`
    );
    updated++;
  }

  console.log(`\nDone. Updated ${updated} product(s), skipped ${skipped}.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

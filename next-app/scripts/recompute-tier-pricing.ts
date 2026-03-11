import { db } from '../lib/db';
import { products, pricingTiers } from '../shared/schema';
import { asc, eq } from 'drizzle-orm';

const TIER_RANGES = [
  { minQuantity: 1, maxQuantity: 99 },
  { minQuantity: 100, maxQuantity: 249 },
  { minQuantity: 250, maxQuantity: 999 },
  { minQuantity: 1000, maxQuantity: 1999 },
  { minQuantity: 2000, maxQuantity: 4999 },
  { minQuantity: 5000, maxQuantity: null },
] as const;

function buildTierPricesFromBase(basePrice: number): string[] {
  const tier2 = Number((basePrice * 2.5).toFixed(2));
  const tier1 = Number((tier2 * 2.5).toFixed(2));
  const tier4 = Number((basePrice * 0.75).toFixed(2));
  const tier5 = Number((tier4 * 0.75).toFixed(2));
  const tier6 = Number((tier5 * 0.75).toFixed(2));

  return [tier1, tier2, basePrice, tier4, tier5, tier6].map((value) => value.toFixed(2));
}

async function main() {
  console.log('Recomputing pricing tiers using Tier 3 base formula...\n');

  const allProducts = await db.select().from(products).orderBy(asc(products.id));
  let updatedProducts = 0;

  for (const product of allProducts) {
    const productTiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, product.id))
      .orderBy(asc(pricingTiers.minQuantity));

    if (productTiers.length === 0) {
      console.log(`⚠️ No tiers found for ${product.slug}, skipping`);
      continue;
    }

    const canonicalTier3 = productTiers.find((tier) => tier.minQuantity === 250);
    const sourceBase = Number(canonicalTier3?.pricePerUnit ?? product.basePrice ?? '0');

    if (!Number.isFinite(sourceBase) || sourceBase <= 0) {
      console.log(`⚠️ Invalid source base for ${product.slug}, skipping`);
      continue;
    }

    const nextPrices = buildTierPricesFromBase(sourceBase);

    await db.delete(pricingTiers).where(eq(pricingTiers.productId, product.id));

    await db.insert(pricingTiers).values(
      TIER_RANGES.map((range, index) => ({
        productId: product.id,
        minQuantity: range.minQuantity,
        maxQuantity: range.maxQuantity,
        pricePerUnit: nextPrices[index],
      }))
    );

    await db
      .update(products)
      .set({ basePrice: nextPrices[2] })
      .where(eq(products.id, product.id));

    updatedProducts += 1;
  }

  console.log(`\n✅ Recomputed tiers for ${updatedProducts} products.`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

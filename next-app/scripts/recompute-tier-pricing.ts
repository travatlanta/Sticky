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

const LEGACY_BASE_BY_SLUG: Record<string, number> = {
  '1-inch-circle-stickers': 0.13,
  '1-5-inch-circle-stickers': 0.14,
  '2-inch-circle-stickers': 0.15,
  '2-5-inch-circle-stickers': 0.16,
  '3-inch-circle-stickers': 0.17,
  '3-5-inch-circle-stickers': 0.18,
  '4-inch-circle-stickers': 0.19,
  '4-5-inch-circle-stickers': 0.2,
  '5-inch-circle-stickers': 0.21,
  '5-5-inch-circle-stickers': 0.22,
  '6-inch-circle-stickers': 0.23,
  '1x1-square-stickers': 0.12,
  '1x2-square-stickers': 0.14,
  '1x3-square-stickers': 0.15,
  '1x4-square-stickers': 0.16,
  '1x5-square-stickers': 0.17,
  '1x6-square-stickers': 0.19,
  '2x2-square-stickers': 0.16,
  '2x3-square-stickers': 0.21,
  '2x4-square-stickers': 0.24,
  '2x5-square-stickers': 0.27,
  '2x6-square-stickers': 0.3,
  '3x3-square-stickers': 0.23,
  '3x4-square-stickers': 0.27,
  '3x5-square-stickers': 0.3,
  '3x6-square-stickers': 0.34,
  '4x4-square-stickers': 0.32,
  '4x5-square-stickers': 0.37,
  '4x6-square-stickers': 0.43,
  '5x5-square-stickers': 0.44,
  '5x6-square-stickers': 0.5,
  '6x6-square-stickers': 0.58,
};

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
    const sourceBase =
      LEGACY_BASE_BY_SLUG[product.slug] ??
      Number(canonicalTier3?.pricePerUnit ?? product.basePrice ?? '0');

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

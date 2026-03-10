import { and, eq } from 'drizzle-orm';
import { db } from '../lib/db';
import { pricingTiers, productOptions, products } from '../shared/schema';

type FourTiers = [number, number, number, number];

const SHEET_PRICES: Record<string, { standard: FourTiers; gloss: FourTiers }> = {
  '1-inch-circle-stickers': { standard: [0.13, 0.12, 0.10, 0.08], gloss: [0.16, 0.14, 0.12, 0.10] },
  '1-5-inch-circle-stickers': { standard: [0.14, 0.13, 0.11, 0.09], gloss: [0.19, 0.16, 0.14, 0.12] },
  '2-inch-circle-stickers': { standard: [0.15, 0.13, 0.12, 0.10], gloss: [0.21, 0.19, 0.16, 0.13] },
  '2-5-inch-circle-stickers': { standard: [0.16, 0.14, 0.12, 0.10], gloss: [0.24, 0.21, 0.18, 0.15] },
  '3-inch-circle-stickers': { standard: [0.18, 0.15, 0.13, 0.11], gloss: [0.26, 0.23, 0.20, 0.16] },
  '3-5-inch-circle-stickers': { standard: [0.19, 0.16, 0.14, 0.12], gloss: [0.29, 0.25, 0.22, 0.18] },
  '4-inch-circle-stickers': { standard: [0.20, 0.17, 0.15, 0.12], gloss: [0.31, 0.27, 0.23, 0.20] },
  '4-5-inch-circle-stickers': { standard: [0.21, 0.18, 0.16, 0.13], gloss: [0.34, 0.30, 0.25, 0.21] },
  '5-inch-circle-stickers': { standard: [0.22, 0.19, 0.16, 0.14], gloss: [0.36, 0.32, 0.27, 0.23] },
  '5-5-inch-circle-stickers': { standard: [0.23, 0.20, 0.17, 0.14], gloss: [0.39, 0.34, 0.29, 0.24] },
  '6-inch-circle-stickers': { standard: [0.24, 0.21, 0.18, 0.15], gloss: [0.41, 0.36, 0.31, 0.26] },

  '1x1-square-stickers': { standard: [0.12, 0.11, 0.09, 0.08], gloss: [0.14, 0.13, 0.11, 0.09] },
  '1x2-square-stickers': { standard: [0.14, 0.12, 0.10, 0.09], gloss: [0.18, 0.15, 0.13, 0.11] },
  '1x3-square-stickers': { standard: [0.15, 0.13, 0.11, 0.10], gloss: [0.21, 0.18, 0.16, 0.13] },
  '1x4-square-stickers': { standard: [0.17, 0.14, 0.12, 0.10], gloss: [0.24, 0.21, 0.18, 0.15] },
  '1x5-square-stickers': { standard: [0.18, 0.16, 0.13, 0.11], gloss: [0.27, 0.24, 0.20, 0.17] },
  '1x6-square-stickers': { standard: [0.19, 0.17, 0.14, 0.12], gloss: [0.30, 0.27, 0.23, 0.19] },
  '2x2-square-stickers': { standard: [0.17, 0.14, 0.12, 0.10], gloss: [0.24, 0.21, 0.18, 0.15] },
  '2x3-square-stickers': { standard: [0.19, 0.17, 0.14, 0.12], gloss: [0.30, 0.27, 0.23, 0.19] },
  '2x4-square-stickers': { standard: [0.22, 0.19, 0.16, 0.14], gloss: [0.37, 0.32, 0.28, 0.23] },
  '2x5-square-stickers': { standard: [0.25, 0.22, 0.19, 0.15], gloss: [0.43, 0.38, 0.32, 0.27] },
  '2x6-square-stickers': { standard: [0.27, 0.24, 0.21, 0.17], gloss: [0.49, 0.43, 0.37, 0.31] },
  '3x3-square-stickers': { standard: [0.23, 0.20, 0.18, 0.15], gloss: [0.40, 0.35, 0.30, 0.25] },
  '3x4-square-stickers': { standard: [0.27, 0.24, 0.21, 0.17], gloss: [0.49, 0.43, 0.37, 0.31] },
  '3x5-square-stickers': { standard: [0.31, 0.28, 0.24, 0.20], gloss: [0.59, 0.52, 0.44, 0.37] },
  '3x6-square-stickers': { standard: [0.36, 0.31, 0.27, 0.22], gloss: [0.69, 0.60, 0.52, 0.43] },
  '4x4-square-stickers': { standard: [0.33, 0.29, 0.25, 0.21], gloss: [0.62, 0.54, 0.47, 0.39] },
  '4x5-square-stickers': { standard: [0.38, 0.33, 0.29, 0.24], gloss: [0.75, 0.66, 0.56, 0.47] },
  '4x6-square-stickers': { standard: [0.44, 0.38, 0.33, 0.27], gloss: [0.88, 0.77, 0.66, 0.55] },
  '5x5-square-stickers': { standard: [0.45, 0.39, 0.34, 0.28], gloss: [0.91, 0.80, 0.68, 0.57] },
  '5x6-square-stickers': { standard: [0.52, 0.45, 0.39, 0.32], gloss: [1.07, 0.94, 0.80, 0.67] },
  '6x6-square-stickers': { standard: [0.60, 0.52, 0.45, 0.37], gloss: [1.26, 1.10, 0.95, 0.79] },
};

const TIER_RANGES = [
  { min: 1, max: 99 },
  { min: 100, max: 249 },
  { min: 250, max: 999 },
  { min: 1000, max: 1999 },
  { min: 2000, max: 4999 },
  { min: 5000, max: null },
] as const;

function expandFourTierStandard(standard: FourTiers): [number, number, number, number, number, number] {
  return [standard[0], standard[0], standard[0], standard[1], standard[2], standard[3]];
}

function expandFourTierDiffs(standard: FourTiers, gloss: FourTiers): [number, number, number, number, number, number] {
  const d250 = Number((gloss[0] - standard[0]).toFixed(2));
  const d1k = Number((gloss[1] - standard[1]).toFixed(2));
  const d2k = Number((gloss[2] - standard[2]).toFixed(2));
  const d5k = Number((gloss[3] - standard[3]).toFixed(2));
  return [d250, d250, d250, d1k, d2k, d5k];
}

async function main() {
  console.log('Syncing pricing tiers and gloss modifiers from screenshot sheet...');

  let updatedProducts = 0;
  let updatedVinylOptions = 0;
  const missingProducts: string[] = [];

  for (const [slug, priceData] of Object.entries(SHEET_PRICES)) {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));

    if (!product) {
      missingProducts.push(slug);
      continue;
    }

    const sixTierStandard = expandFourTierStandard(priceData.standard);
    const sixTierDiffs = expandFourTierDiffs(priceData.standard, priceData.gloss);

    await db.delete(pricingTiers).where(eq(pricingTiers.productId, product.id));

    await db.insert(pricingTiers).values(
      TIER_RANGES.map((range, i) => ({
        productId: product.id,
        minQuantity: range.min,
        maxQuantity: range.max,
        pricePerUnit: sixTierStandard[i].toFixed(4),
      }))
    );

    await db
      .update(products)
      .set({ basePrice: sixTierStandard[2].toFixed(2) })
      .where(eq(products.id, product.id));

    const [vinyl] = await db
      .select()
      .from(productOptions)
      .where(
        and(
          eq(productOptions.productId, product.id),
          eq(productOptions.optionType, 'material'),
          eq(productOptions.name, 'Vinyl')
        )
      );

    if (vinyl) {
      await db
        .update(productOptions)
        .set({
          priceModifier: sixTierDiffs[0].toFixed(2),
          tier2PriceModifier: sixTierDiffs[1].toFixed(4),
          tier3PriceModifier: sixTierDiffs[2].toFixed(4),
          tier4PriceModifier: sixTierDiffs[3].toFixed(4),
          tier5PriceModifier: sixTierDiffs[4].toFixed(4),
          tier6PriceModifier: sixTierDiffs[5].toFixed(4),
        })
        .where(eq(productOptions.id, vinyl.id));

      updatedVinylOptions += 1;
    }

    updatedProducts += 1;
  }

  console.log(`Updated products: ${updatedProducts}`);
  console.log(`Updated Vinyl option tier modifiers: ${updatedVinylOptions}`);

  if (missingProducts.length > 0) {
    console.log(`Missing products (${missingProducts.length}): ${missingProducts.join(', ')}`);
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error('Fatal error while syncing sheet prices:', error);
  process.exit(1);
});

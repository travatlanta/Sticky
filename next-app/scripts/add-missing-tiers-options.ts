import { db } from '../lib/db';
import { products, productOptions, pricingTiers } from '../shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_COATING_OPTIONS = [
  { optionType: 'coating' as const, name: 'None', value: 'none', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'coating' as const, name: 'Varnish', value: 'varnish', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
  { optionType: 'coating' as const, name: 'Emboss', value: 'emboss', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
  { optionType: 'coating' as const, name: 'Both', value: 'both', priceModifier: '0.00', isDefault: false, displayOrder: 4 },
];

const DEFAULT_CUT_OPTIONS = [
  { optionType: 'cut' as const, name: 'Standard', value: 'Kiss cut', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'cut' as const, name: 'Die Cut', value: 'Die cut', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
];

interface ProductPricing {
  slug: string;
  standardPrices: [number, number, number, number];
  glossPrices: [number, number, number, number];
}

const productPricing: ProductPricing[] = [
  { slug: '1-inch-circle-stickers', standardPrices: [0.13, 0.11, 0.10, 0.08], glossPrices: [0.16, 0.14, 0.14, 0.10] },
  { slug: '1-5-inch-circle-stickers', standardPrices: [0.14, 0.12, 0.11, 0.09], glossPrices: [0.18, 0.16, 0.14, 0.11] },
  { slug: '2-inch-circle-stickers', standardPrices: [0.15, 0.13, 0.11, 0.09], glossPrices: [0.21, 0.20, 0.16, 0.13] },
  { slug: '2-5-inch-circle-stickers', standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.23, 0.20, 0.17, 0.15] },
  { slug: '3-inch-circle-stickers', standardPrices: [0.17, 0.15, 0.13, 0.11], glossPrices: [0.26, 0.23, 0.19, 0.18] },
  { slug: '3-5-inch-circle-stickers', standardPrices: [0.18, 0.16, 0.14, 0.11], glossPrices: [0.28, 0.25, 0.21, 0.18] },
  { slug: '4-inch-circle-stickers', standardPrices: [0.19, 0.17, 0.14, 0.12], glossPrices: [0.31, 0.27, 0.23, 0.19] },
  { slug: '4-5-inch-circle-stickers', standardPrices: [0.20, 0.18, 0.15, 0.13], glossPrices: [0.33, 0.29, 0.25, 0.21] },
  { slug: '5-inch-circle-stickers', standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.36, 0.31, 0.27, 0.22] },
  { slug: '5-5-inch-circle-stickers', standardPrices: [0.22, 0.19, 0.17, 0.14], glossPrices: [0.38, 0.33, 0.29, 0.24] },
  { slug: '6-inch-circle-stickers', standardPrices: [0.23, 0.20, 0.17, 0.15], glossPrices: [0.41, 0.36, 0.30, 0.25] },
  { slug: '1x1-square-stickers', standardPrices: [0.12, 0.11, 0.09, 0.08], glossPrices: [0.14, 0.12, 0.11, 0.09] },
  { slug: '1x2-square-stickers', standardPrices: [0.14, 0.12, 0.10, 0.08], glossPrices: [0.17, 0.13, 0.11, 0.11] },
  { slug: '1x3-square-stickers', standardPrices: [0.15, 0.13, 0.11, 0.09], glossPrices: [0.20, 0.18, 0.15, 0.13] },
  { slug: '1x4-square-stickers', standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.24, 0.21, 0.18, 0.15] },
  { slug: '1x5-square-stickers', standardPrices: [0.17, 0.15, 0.13, 0.11], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { slug: '1x6-square-stickers', standardPrices: [0.19, 0.16, 0.14, 0.12], glossPrices: [0.30, 0.26, 0.22, 0.19] },
  { slug: '2x2-square-stickers', standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.19, 0.16, 0.14, 0.14] },
  { slug: '2x3-square-stickers', standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { slug: '2x4-square-stickers', standardPrices: [0.24, 0.21, 0.18, 0.15], glossPrices: [0.36, 0.32, 0.27, 0.23] },
  { slug: '2x5-square-stickers', standardPrices: [0.27, 0.23, 0.20, 0.17], glossPrices: [0.49, 0.43, 0.36, 0.30] },
  { slug: '2x6-square-stickers', standardPrices: [0.30, 0.26, 0.22, 0.19], glossPrices: [0.42, 0.37, 0.32, 0.26] },
  { slug: '3x3-square-stickers', standardPrices: [0.23, 0.20, 0.17, 0.14], glossPrices: [0.34, 0.30, 0.26, 0.21] },
  { slug: '3x4-square-stickers', standardPrices: [0.27, 0.23, 0.19, 0.19], glossPrices: [0.43, 0.36, 0.30, 0.25] },
  { slug: '3x5-square-stickers', standardPrices: [0.30, 0.27, 0.23, 0.19], glossPrices: [0.58, 0.51, 0.44, 0.36] },
  { slug: '3x6-square-stickers', standardPrices: [0.34, 0.30, 0.26, 0.21], glossPrices: [0.68, 0.59, 0.51, 0.42] },
  { slug: '4x4-square-stickers', standardPrices: [0.32, 0.28, 0.24, 0.20], glossPrices: [0.54, 0.46, 0.38, 0.30] },
  { slug: '4x5-square-stickers', standardPrices: [0.37, 0.32, 0.28, 0.23], glossPrices: [0.65, 0.55, 0.46, 0.38] },
  { slug: '4x6-square-stickers', standardPrices: [0.43, 0.36, 0.30, 0.25], glossPrices: [0.89, 0.74, 0.63, 0.46] },
  { slug: '5x5-square-stickers', standardPrices: [0.44, 0.38, 0.31, 0.27], glossPrices: [0.78, 0.67, 0.56, 0.46] },
  { slug: '5x6-square-stickers', standardPrices: [0.50, 0.44, 0.38, 0.31], glossPrices: [1.05, 0.92, 0.79, 0.66] },
  { slug: '6x6-square-stickers', standardPrices: [0.58, 0.51, 0.43, 0.36], glossPrices: [1.24, 1.09, 0.93, 0.78] },
];

async function main() {
  console.log('Adding missing pricing tiers and options...\n');

  const tierRanges = [
    { min: 1, max: 249 },
    { min: 250, max: 999 },
    { min: 1000, max: 1999 },
    { min: 2000, max: 5000 },
  ];

  for (const pricing of productPricing) {
    const [product] = await db.select().from(products).where(eq(products.slug, pricing.slug));
    
    if (!product) {
      console.log(`❌ Product not found: ${pricing.slug}`);
      continue;
    }

    const existingOptions = await db.select().from(productOptions).where(eq(productOptions.productId, product.id));
    const existingTiers = await db.select().from(pricingTiers).where(eq(pricingTiers.productId, product.id));

    if (existingOptions.length === 0) {
      const glossModifier = Math.max(0, pricing.glossPrices[0] - pricing.standardPrices[0]);
      
      const materialOptions = [
        { optionType: 'material' as const, name: 'Vinyl', value: 'vinyl', priceModifier: glossModifier.toFixed(2), isDefault: true, displayOrder: 1 },
        { optionType: 'material' as const, name: 'Foil', value: 'foil', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
        { optionType: 'material' as const, name: 'Holographic', value: 'holographic', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
      ];

      await db.insert(productOptions).values([
        ...materialOptions.map(opt => ({ ...opt, productId: product.id, isActive: true })),
        ...DEFAULT_COATING_OPTIONS.map(opt => ({ ...opt, productId: product.id, isActive: true })),
        ...DEFAULT_CUT_OPTIONS.map(opt => ({ ...opt, productId: product.id, isActive: true })),
      ]);
      console.log(`✅ Added options for ${product.name}`);
    } else {
      console.log(`⚠️ Options already exist for ${product.name}`);
    }

    if (existingTiers.length === 0) {
      for (let i = 0; i < 4; i++) {
        await db.insert(pricingTiers).values({
          productId: product.id,
          minQuantity: tierRanges[i].min,
          maxQuantity: tierRanges[i].max,
          pricePerUnit: pricing.standardPrices[i].toFixed(4),
        });
      }
      console.log(`✅ Added pricing tiers for ${product.name}`);
    } else {
      console.log(`⚠️ Pricing tiers already exist for ${product.name}`);
    }
  }

  console.log('\n✅ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

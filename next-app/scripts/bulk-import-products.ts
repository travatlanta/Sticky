import { db } from '../lib/db';
import { products, productOptions, pricingTiers, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_COATING_OPTIONS = [
  { optionType: 'coating' as const, name: 'None', value: 'none', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'coating' as const, name: 'Varnish', value: 'varnish', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
  { optionType: 'coating' as const, name: 'Emboss', value: 'emboss', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
  { optionType: 'coating' as const, name: 'Both', value: 'both', priceModifier: '0.00', isDefault: false, displayOrder: 4 },
];

const DEFAULT_CUT_OPTIONS = [
  { optionType: 'cut' as const, name: 'Standard', value: 'Kiss cut - stickers are cut through the vinyl but not the backing paper. Easy to peel.', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'cut' as const, name: 'Die Cut', value: 'Stickers are cut completely through both vinyl and backing to your exact shape.', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
];

interface ProductData {
  name: string;
  slug: string;
  sizeInches: number;
  widthInches?: number;
  heightInches?: number;
  categorySlug: string;
  standardPrices: [number, number, number, number];
  glossPrices: [number, number, number, number];
}

// CIRCLES - From spreadsheet
const circleProducts: ProductData[] = [
  { name: '1" Circle Stickers', slug: '1-inch-circle-stickers', sizeInches: 1, categorySlug: 'circles',
    standardPrices: [0.13, 0.11, 0.10, 0.08], glossPrices: [0.16, 0.14, 0.14, 0.10] },
  { name: '1.5" Circle Stickers', slug: '1-5-inch-circle-stickers', sizeInches: 1.5, categorySlug: 'circles',
    standardPrices: [0.14, 0.12, 0.11, 0.09], glossPrices: [0.18, 0.16, 0.14, 0.11] },
  { name: '2" Circle Stickers', slug: '2-inch-circle-stickers', sizeInches: 2, categorySlug: 'circles',
    standardPrices: [0.15, 0.13, 0.11, 0.09], glossPrices: [0.21, 0.20, 0.16, 0.13] },
  { name: '2.5" Circle Stickers', slug: '2-5-inch-circle-stickers', sizeInches: 2.5, categorySlug: 'circles',
    standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.23, 0.20, 0.17, 0.15] },
  { name: '3" Circle Stickers', slug: '3-inch-circle-stickers', sizeInches: 3, categorySlug: 'circles',
    standardPrices: [0.17, 0.15, 0.13, 0.11], glossPrices: [0.26, 0.23, 0.19, 0.18] },
  { name: '3.5" Circle Stickers', slug: '3-5-inch-circle-stickers', sizeInches: 3.5, categorySlug: 'circles',
    standardPrices: [0.18, 0.16, 0.14, 0.11], glossPrices: [0.28, 0.25, 0.21, 0.18] },
  { name: '4" Circle Stickers', slug: '4-inch-circle-stickers', sizeInches: 4, categorySlug: 'circles',
    standardPrices: [0.19, 0.17, 0.14, 0.12], glossPrices: [0.31, 0.27, 0.23, 0.19] },
  { name: '4.5" Circle Stickers', slug: '4-5-inch-circle-stickers', sizeInches: 4.5, categorySlug: 'circles',
    standardPrices: [0.20, 0.18, 0.15, 0.13], glossPrices: [0.33, 0.29, 0.25, 0.21] },
  { name: '5" Circle Stickers', slug: '5-inch-circle-stickers', sizeInches: 5, categorySlug: 'circles',
    standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.36, 0.31, 0.27, 0.22] },
  { name: '5.5" Circle Stickers', slug: '5-5-inch-circle-stickers', sizeInches: 5.5, categorySlug: 'circles',
    standardPrices: [0.22, 0.19, 0.17, 0.14], glossPrices: [0.38, 0.33, 0.29, 0.24] },
  { name: '6" Circle Stickers', slug: '6-inch-circle-stickers', sizeInches: 6, categorySlug: 'circles',
    standardPrices: [0.23, 0.20, 0.17, 0.15], glossPrices: [0.41, 0.36, 0.30, 0.25] },
];

// SQUARES - From spreadsheet  
const squareProducts: ProductData[] = [
  { name: '1x1 Square Stickers', slug: '1x1-square-stickers', sizeInches: 1, widthInches: 1, heightInches: 1, categorySlug: 'squares',
    standardPrices: [0.12, 0.11, 0.09, 0.08], glossPrices: [0.14, 0.12, 0.11, 0.09] },
  { name: '1x2 Square Stickers', slug: '1x2-square-stickers', sizeInches: 1.5, widthInches: 1, heightInches: 2, categorySlug: 'squares',
    standardPrices: [0.14, 0.12, 0.10, 0.08], glossPrices: [0.17, 0.13, 0.11, 0.11] },
  { name: '1x3 Square Stickers', slug: '1x3-square-stickers', sizeInches: 2, widthInches: 1, heightInches: 3, categorySlug: 'squares',
    standardPrices: [0.15, 0.13, 0.11, 0.09], glossPrices: [0.20, 0.18, 0.15, 0.13] },
  { name: '1x4 Square Stickers', slug: '1x4-square-stickers', sizeInches: 2.5, widthInches: 1, heightInches: 4, categorySlug: 'squares',
    standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.24, 0.21, 0.18, 0.15] },
  { name: '1x5 Square Stickers', slug: '1x5-square-stickers', sizeInches: 3, widthInches: 1, heightInches: 5, categorySlug: 'squares',
    standardPrices: [0.17, 0.15, 0.13, 0.11], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { name: '1x6 Square Stickers', slug: '1x6-square-stickers', sizeInches: 3.5, widthInches: 1, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.19, 0.16, 0.14, 0.12], glossPrices: [0.30, 0.26, 0.22, 0.19] },
  { name: '2x2 Square Stickers', slug: '2x2-square-stickers', sizeInches: 2, widthInches: 2, heightInches: 2, categorySlug: 'squares',
    standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.19, 0.16, 0.14, 0.14] },
  { name: '2x3 Square Stickers', slug: '2x3-square-stickers', sizeInches: 2.5, widthInches: 2, heightInches: 3, categorySlug: 'squares',
    standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { name: '2x4 Square Stickers', slug: '2x4-square-stickers', sizeInches: 3, widthInches: 2, heightInches: 4, categorySlug: 'squares',
    standardPrices: [0.24, 0.21, 0.18, 0.15], glossPrices: [0.36, 0.32, 0.27, 0.23] },
  { name: '2x5 Square Stickers', slug: '2x5-square-stickers', sizeInches: 3.5, widthInches: 2, heightInches: 5, categorySlug: 'squares',
    standardPrices: [0.27, 0.23, 0.20, 0.17], glossPrices: [0.49, 0.43, 0.36, 0.30] },
  { name: '2x6 Square Stickers', slug: '2x6-square-stickers', sizeInches: 4, widthInches: 2, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.30, 0.26, 0.22, 0.19], glossPrices: [0.42, 0.37, 0.32, 0.26] },
  { name: '3x3 Square Stickers', slug: '3x3-square-stickers', sizeInches: 3, widthInches: 3, heightInches: 3, categorySlug: 'squares',
    standardPrices: [0.23, 0.20, 0.17, 0.14], glossPrices: [0.34, 0.30, 0.26, 0.21] },
  { name: '3x4 Square Stickers', slug: '3x4-square-stickers', sizeInches: 3.5, widthInches: 3, heightInches: 4, categorySlug: 'squares',
    standardPrices: [0.27, 0.23, 0.19, 0.19], glossPrices: [0.43, 0.36, 0.30, 0.25] },
  { name: '3x5 Square Stickers', slug: '3x5-square-stickers', sizeInches: 4, widthInches: 3, heightInches: 5, categorySlug: 'squares',
    standardPrices: [0.30, 0.27, 0.23, 0.19], glossPrices: [0.58, 0.51, 0.44, 0.36] },
  { name: '3x6 Square Stickers', slug: '3x6-square-stickers', sizeInches: 4.5, widthInches: 3, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.34, 0.30, 0.26, 0.21], glossPrices: [0.68, 0.59, 0.51, 0.42] },
  { name: '4x4 Square Stickers', slug: '4x4-square-stickers', sizeInches: 4, widthInches: 4, heightInches: 4, categorySlug: 'squares',
    standardPrices: [0.32, 0.28, 0.24, 0.20], glossPrices: [0.54, 0.46, 0.38, 0.30] },
  { name: '4x5 Square Stickers', slug: '4x5-square-stickers', sizeInches: 4.5, widthInches: 4, heightInches: 5, categorySlug: 'squares',
    standardPrices: [0.37, 0.32, 0.28, 0.23], glossPrices: [0.65, 0.55, 0.46, 0.38] },
  { name: '4x6 Square Stickers', slug: '4x6-square-stickers', sizeInches: 5, widthInches: 4, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.43, 0.36, 0.30, 0.25], glossPrices: [0.89, 0.74, 0.63, 0.46] },
  { name: '5x5 Square Stickers', slug: '5x5-square-stickers', sizeInches: 5, widthInches: 5, heightInches: 5, categorySlug: 'squares',
    standardPrices: [0.44, 0.38, 0.31, 0.27], glossPrices: [0.78, 0.67, 0.56, 0.46] },
  { name: '5x6 Square Stickers', slug: '5x6-square-stickers', sizeInches: 5.5, widthInches: 5, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.50, 0.44, 0.38, 0.31], glossPrices: [1.05, 0.92, 0.79, 0.66] },
  { name: '6x6 Square Stickers', slug: '6x6-square-stickers', sizeInches: 6, widthInches: 6, heightInches: 6, categorySlug: 'squares',
    standardPrices: [0.58, 0.51, 0.43, 0.36], glossPrices: [1.24, 1.09, 0.93, 0.78] },
];

async function main() {
  console.log('Starting bulk product import...\n');

  const results = {
    categoriesCreated: [] as string[],
    productsCreated: [] as string[],
    errors: [] as string[],
  };

  // Create categories if they don't exist
  const categoryData = [
    { name: 'Circles', slug: 'circles', description: 'Round circle stickers in various sizes from 1" to 6"', displayOrder: 1 },
    { name: 'Squares', slug: 'squares', description: 'Square and rectangle stickers in various sizes', displayOrder: 2 },
  ];

  const categoryMap: Record<string, number> = {};

  for (const cat of categoryData) {
    const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug));
    if (existing.length > 0) {
      categoryMap[cat.slug] = existing[0].id;
      console.log(`Category "${cat.name}" already exists (ID: ${existing[0].id})`);
    } else {
      const [newCat] = await db.insert(categories).values(cat).returning();
      categoryMap[cat.slug] = newCat.id;
      results.categoriesCreated.push(cat.name);
      console.log(`Created category "${cat.name}" (ID: ${newCat.id})`);
    }
  }

  // Import all products
  const allProducts = [...circleProducts, ...squareProducts];
  console.log(`\nImporting ${allProducts.length} products...\n`);

  for (const prod of allProducts) {
    try {
      // Check if product already exists
      const existing = await db.select().from(products).where(eq(products.slug, prod.slug));
      if (existing.length > 0) {
        console.log(`⚠️  Product "${prod.name}" already exists, skipping`);
        continue;
      }

      // Calculate gloss modifier (difference between gloss tier1 and standard tier1)
      const glossModifier = Math.max(0, prod.glossPrices[0] - prod.standardPrices[0]);

      // Template dimensions based on size (300 DPI)
      const width = prod.widthInches || prod.sizeInches;
      const height = prod.heightInches || prod.sizeInches;
      const templateWidth = Math.round(width * 300);
      const templateHeight = Math.round(height * 300);

      // Create product with custom tiers (useGlobalTiers = false)
      const [product] = await db.insert(products).values({
        name: prod.name,
        slug: prod.slug,
        description: `High-quality ${prod.name.toLowerCase()} printed on premium vinyl.`,
        categoryId: categoryMap[prod.categorySlug],
        basePrice: prod.standardPrices[0].toFixed(2),
        minQuantity: 1,
        isActive: true,
        isFeatured: false,
        useGlobalTiers: false,
        templateWidth,
        templateHeight,
        printWidthInches: width.toString(),
        printHeightInches: height.toString(),
        shippingType: 'calculated',
      }).returning();

      // Create material options with Vinyl/Gloss price modifier
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

      // Create 4 pricing tiers
      const tierRanges = [
        { min: 1, max: 249 },
        { min: 250, max: 999 },
        { min: 1000, max: 1999 },
        { min: 2000, max: 5000 },
      ];

      for (let i = 0; i < 4; i++) {
        await db.insert(pricingTiers).values({
          productId: product.id,
          minQuantity: tierRanges[i].min,
          maxQuantity: tierRanges[i].max,
          pricePerUnit: prod.standardPrices[i].toFixed(4),
        });
      }

      results.productsCreated.push(prod.name);
      console.log(`✅ Created "${prod.name}" (ID: ${product.id}) - Base: $${prod.standardPrices[0]}, Gloss modifier: +$${glossModifier.toFixed(2)}`);
    } catch (err: any) {
      results.errors.push(`Failed to create ${prod.name}: ${err.message}`);
      console.error(`❌ Failed to create "${prod.name}": ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('IMPORT COMPLETE');
  console.log('========================================');
  console.log(`Categories created: ${results.categoriesCreated.length}`);
  console.log(`Products created: ${results.productsCreated.length}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

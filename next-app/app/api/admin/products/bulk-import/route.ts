export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers, categories } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const DEFAULT_MATERIAL_OPTIONS = [
  { optionType: 'material' as const, name: 'Vinyl', value: 'vinyl', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'material' as const, name: 'Foil', value: 'foil', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
  { optionType: 'material' as const, name: 'Holographic', value: 'holographic', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
];

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

// Pricing data from master spreadsheet
// Each product has: [tier1Price, tier2Price, tier3Price, tier4Price] for Standard
// and [glossTier1, glossTier2, glossTier3, glossTier4] for w/Gloss
// Tier ranges: 1-249, 250-999, 1000-1999, 2000-5000

interface ProductData {
  name: string;
  slug: string;
  sizeInches: number;
  categorySlug: string;
  standardPrices: [number, number, number, number]; // Tier 1-4 per-sticker prices
  glossPrices: [number, number, number, number]; // w/Gloss per-sticker prices
}

// CIRCLES - From spreadsheet (reading Standard and w/Gloss columns)
// Format: [1-249, 250-999, 1000-1999, 2000-5000]
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
  { name: '1x1 Square Stickers', slug: '1x1-square-stickers', sizeInches: 1, categorySlug: 'squares',
    standardPrices: [0.12, 0.11, 0.09, 0.08], glossPrices: [0.14, 0.12, 0.11, 0.09] },
  { name: '1x2 Square Stickers', slug: '1x2-square-stickers', sizeInches: 1.5, categorySlug: 'squares',
    standardPrices: [0.14, 0.12, 0.10, 0.08], glossPrices: [0.17, 0.13, 0.11, 0.11] },
  { name: '1x3 Square Stickers', slug: '1x3-square-stickers', sizeInches: 2, categorySlug: 'squares',
    standardPrices: [0.15, 0.13, 0.11, 0.09], glossPrices: [0.20, 0.18, 0.15, 0.13] },
  { name: '1x4 Square Stickers', slug: '1x4-square-stickers', sizeInches: 2.5, categorySlug: 'squares',
    standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.24, 0.21, 0.18, 0.15] },
  { name: '1x5 Square Stickers', slug: '1x5-square-stickers', sizeInches: 3, categorySlug: 'squares',
    standardPrices: [0.17, 0.15, 0.13, 0.11], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { name: '1x6 Square Stickers', slug: '1x6-square-stickers', sizeInches: 3.5, categorySlug: 'squares',
    standardPrices: [0.19, 0.16, 0.14, 0.12], glossPrices: [0.30, 0.26, 0.22, 0.19] },
  { name: '2x2 Square Stickers', slug: '2x2-square-stickers', sizeInches: 2, categorySlug: 'squares',
    standardPrices: [0.16, 0.14, 0.12, 0.10], glossPrices: [0.19, 0.16, 0.14, 0.14] },
  { name: '2x3 Square Stickers', slug: '2x3-square-stickers', sizeInches: 2.5, categorySlug: 'squares',
    standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { name: '2x4 Square Stickers', slug: '2x4-square-stickers', sizeInches: 3, categorySlug: 'squares',
    standardPrices: [0.24, 0.21, 0.18, 0.15], glossPrices: [0.36, 0.32, 0.27, 0.23] },
  { name: '2x5 Square Stickers', slug: '2x5-square-stickers', sizeInches: 3.5, categorySlug: 'squares',
    standardPrices: [0.27, 0.23, 0.20, 0.17], glossPrices: [0.49, 0.43, 0.36, 0.30] },
  { name: '2x6 Square Stickers', slug: '2x6-square-stickers', sizeInches: 4, categorySlug: 'squares',
    standardPrices: [0.30, 0.26, 0.22, 0.19], glossPrices: [0.42, 0.37, 0.32, 0.26] },
  { name: '3x3 Square Stickers', slug: '3x3-square-stickers', sizeInches: 3, categorySlug: 'squares',
    standardPrices: [0.23, 0.20, 0.17, 0.14], glossPrices: [0.34, 0.30, 0.26, 0.21] },
  { name: '3x4 Square Stickers', slug: '3x4-square-stickers', sizeInches: 3.5, categorySlug: 'squares',
    standardPrices: [0.27, 0.23, 0.19, 0.19], glossPrices: [0.23, 0.19, 0.19, 0.19] }, // w/Gloss appears same
  { name: '3x5 Square Stickers', slug: '3x5-square-stickers', sizeInches: 4, categorySlug: 'squares',
    standardPrices: [0.30, 0.27, 0.23, 0.19], glossPrices: [0.58, 0.51, 0.44, 0.36] },
  { name: '3x6 Square Stickers', slug: '3x6-square-stickers', sizeInches: 4.5, categorySlug: 'squares',
    standardPrices: [0.34, 0.30, 0.26, 0.21], glossPrices: [0.68, 0.59, 0.51, 0.42] },
  { name: '4x4 Square Stickers', slug: '4x4-square-stickers', sizeInches: 4, categorySlug: 'squares',
    standardPrices: [0.32, 0.28, 0.24, 0.20], glossPrices: [0.54, 0.46, 0.38, 0.30] },
  { name: '4x5 Square Stickers', slug: '4x5-square-stickers', sizeInches: 4.5, categorySlug: 'squares',
    standardPrices: [0.37, 0.32, 0.28, 0.23], glossPrices: [0.65, 0.55, 0.46, 0.38] },
  { name: '4x6 Square Stickers', slug: '4x6-square-stickers', sizeInches: 5, categorySlug: 'squares',
    standardPrices: [0.43, 0.36, 0.30, 0.25], glossPrices: [0.89, 0.74, 0.63, 0.46] },
  { name: '5x5 Square Stickers', slug: '5x5-square-stickers', sizeInches: 5, categorySlug: 'squares',
    standardPrices: [0.44, 0.38, 0.31, 0.27], glossPrices: [0.78, 0.67, 0.56, 0.46] },
  { name: '5x6 Square Stickers', slug: '5x6-square-stickers', sizeInches: 5.5, categorySlug: 'squares',
    standardPrices: [0.50, 0.44, 0.38, 0.31], glossPrices: [1.05, 0.92, 0.79, 0.66] },
  { name: '6x6 Square Stickers', slug: '6x6-square-stickers', sizeInches: 6, categorySlug: 'squares',
    standardPrices: [0.58, 0.51, 0.43, 0.36], glossPrices: [1.24, 1.09, 0.93, 0.78] },
];

// Additional shapes from spreadsheet (4x6 shown in screenshot)
const rectangleProducts: ProductData[] = [
  { name: '1x1.5 Rectangle Stickers', slug: '1x1-5-rectangle-stickers', sizeInches: 1.25, categorySlug: 'rectangles',
    standardPrices: [0.12, 0.10, 0.10, 0.08], glossPrices: [0.16, 0.14, 0.12, 0.10] },
  { name: '1.5x2 Rectangle Stickers', slug: '1-5x2-rectangle-stickers', sizeInches: 1.75, categorySlug: 'rectangles',
    standardPrices: [0.14, 0.11, 0.09, 0.09], glossPrices: [0.18, 0.14, 0.14, 0.11] },
  { name: '2x3 Rectangle Stickers', slug: '2x3-rectangle-stickers', sizeInches: 2.5, categorySlug: 'rectangles',
    standardPrices: [0.21, 0.19, 0.16, 0.13], glossPrices: [0.27, 0.23, 0.20, 0.17] },
  { name: '3x4 Rectangle Stickers', slug: '3x4-rectangle-stickers', sizeInches: 3.5, categorySlug: 'rectangles',
    standardPrices: [0.27, 0.23, 0.19, 0.19], glossPrices: [0.43, 0.36, 0.30, 0.25] },
  { name: '4x6 Rectangle Stickers', slug: '4x6-rectangle-stickers', sizeInches: 5, categorySlug: 'rectangles',
    standardPrices: [0.43, 0.36, 0.30, 0.25], glossPrices: [0.89, 0.74, 0.63, 0.46] },
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const results = {
      categoriesCreated: [] as string[],
      productsCreated: [] as string[],
      errors: [] as string[],
    };

    // Create categories if they don't exist
    const categoryData = [
      { name: 'Circles', slug: 'circles', description: 'Round circle stickers in various sizes from 1" to 6"' },
      { name: 'Squares', slug: 'squares', description: 'Square stickers in various sizes from 1x1 to 6x6' },
      { name: 'Rectangles', slug: 'rectangles', description: 'Rectangle stickers in various sizes' },
    ];

    const categoryMap: Record<string, number> = {};

    for (const cat of categoryData) {
      const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug));
      if (existing.length > 0) {
        categoryMap[cat.slug] = existing[0].id;
      } else {
        const [newCat] = await db.insert(categories).values(cat).returning();
        categoryMap[cat.slug] = newCat.id;
        results.categoriesCreated.push(cat.name);
      }
    }

    // Import all products
    const allProducts = [...circleProducts, ...squareProducts, ...rectangleProducts];

    for (const prod of allProducts) {
      try {
        // Check if product already exists
        const existing = await db.select().from(products).where(eq(products.slug, prod.slug));
        if (existing.length > 0) {
          results.errors.push(`Product ${prod.name} already exists, skipping`);
          continue;
        }

        // Calculate gloss modifier (difference between gloss tier1 and standard tier1)
        const glossModifier = Math.max(0, prod.glossPrices[0] - prod.standardPrices[0]);

        // Template dimensions based on size (300 DPI)
        const templateSize = Math.round(prod.sizeInches * 300);

        // Create product with custom tiers (useGlobalTiers = false)
        const [product] = await db.insert(products).values({
          name: prod.name,
          slug: prod.slug,
          description: `High-quality ${prod.name.toLowerCase()} printed on premium vinyl.`,
          categoryId: categoryMap[prod.categorySlug],
          basePrice: prod.standardPrices[0].toFixed(2), // Tier 1 price as base
          minQuantity: 1,
          isActive: true,
          isFeatured: false,
          useGlobalTiers: false, // Custom pricing tiers
          templateWidth: templateSize,
          templateHeight: templateSize,
          printWidthInches: prod.sizeInches.toString(),
          printHeightInches: prod.sizeInches.toString(),
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
      } catch (err: any) {
        results.errors.push(`Failed to create ${prod.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        categoriesCreated: results.categoriesCreated.length,
        productsCreated: results.productsCreated.length,
        errors: results.errors.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ message: 'Bulk import failed', error: error.message }, { status: 500 });
  }
}

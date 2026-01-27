export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, products, pricingTiers, productOptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const SEED_DATA = {
  categories: [
    { id: 28, name: "Circles", slug: "circles", description: "Round circle stickers in various sizes from 1\" to 6\"", displayOrder: 1, isActive: true },
    { id: 29, name: "Squares", slug: "squares", description: "Square and rectangle stickers in various sizes", displayOrder: 2, isActive: true }
  ],
  products: [
    { id: 268, categoryId: 28, name: "1\" Circle Stickers", slug: "1-inch-circle-stickers", description: "High-quality 1\" circle stickers printed on premium vinyl.", basePrice: "0.13", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 300, templateHeight: 300, printWidthInches: "1.000", printHeightInches: "1.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 269, categoryId: 28, name: "1.5\" Circle Stickers", slug: "1-5-inch-circle-stickers", description: "High-quality 1.5\" circle stickers printed on premium vinyl.", basePrice: "0.14", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 450, templateHeight: 450, printWidthInches: "1.500", printHeightInches: "1.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 270, categoryId: 28, name: "2\" Circle Stickers", slug: "2-inch-circle-stickers", description: "High-quality 2\" circle stickers printed on premium vinyl.", basePrice: "0.15", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 600, templateHeight: 600, printWidthInches: "2.000", printHeightInches: "2.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 271, categoryId: 28, name: "2.5\" Circle Stickers", slug: "2-5-inch-circle-stickers", description: "High-quality 2.5\" circle stickers printed on premium vinyl.", basePrice: "0.16", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 750, templateHeight: 750, printWidthInches: "2.500", printHeightInches: "2.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 272, categoryId: 28, name: "3\" Circle Stickers", slug: "3-inch-circle-stickers", description: "High-quality 3\" circle stickers printed on premium vinyl.", basePrice: "0.17", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 900, printWidthInches: "3.000", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 273, categoryId: 28, name: "3.5\" Circle Stickers", slug: "3-5-inch-circle-stickers", description: "High-quality 3.5\" circle stickers printed on premium vinyl.", basePrice: "0.18", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1050, templateHeight: 1050, printWidthInches: "3.500", printHeightInches: "3.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 274, categoryId: 28, name: "4\" Circle Stickers", slug: "4-inch-circle-stickers", description: "High-quality 4\" circle stickers printed on premium vinyl.", basePrice: "0.19", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1200, templateHeight: 1200, printWidthInches: "4.000", printHeightInches: "4.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 275, categoryId: 28, name: "4.5\" Circle Stickers", slug: "4-5-inch-circle-stickers", description: "High-quality 4.5\" circle stickers printed on premium vinyl.", basePrice: "0.20", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1350, templateHeight: 1350, printWidthInches: "4.500", printHeightInches: "4.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 276, categoryId: 28, name: "5\" Circle Stickers", slug: "5-inch-circle-stickers", description: "High-quality 5\" circle stickers printed on premium vinyl.", basePrice: "0.21", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1500, templateHeight: 1500, printWidthInches: "5.000", printHeightInches: "5.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 277, categoryId: 28, name: "5.5\" Circle Stickers", slug: "5-5-inch-circle-stickers", description: "High-quality 5.5\" circle stickers printed on premium vinyl.", basePrice: "0.22", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1650, templateHeight: 1650, printWidthInches: "5.500", printHeightInches: "5.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 278, categoryId: 28, name: "6\" Circle Stickers", slug: "6-inch-circle-stickers", description: "High-quality 6\" circle stickers printed on premium vinyl.", basePrice: "0.23", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1800, templateHeight: 1800, printWidthInches: "6.000", printHeightInches: "6.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 279, categoryId: 29, name: "1\" Square Stickers", slug: "1-inch-square-stickers", description: "High-quality 1\" square stickers printed on premium vinyl.", basePrice: "0.13", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 300, templateHeight: 300, printWidthInches: "1.000", printHeightInches: "1.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 280, categoryId: 29, name: "1.5\" Square Stickers", slug: "1-5-inch-square-stickers", description: "High-quality 1.5\" square stickers printed on premium vinyl.", basePrice: "0.14", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 450, templateHeight: 450, printWidthInches: "1.500", printHeightInches: "1.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 281, categoryId: 29, name: "2\" Square Stickers", slug: "2-inch-square-stickers", description: "High-quality 2\" square stickers printed on premium vinyl.", basePrice: "0.15", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 600, templateHeight: 600, printWidthInches: "2.000", printHeightInches: "2.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 282, categoryId: 29, name: "2.5\" Square Stickers", slug: "2-5-inch-square-stickers", description: "High-quality 2.5\" square stickers printed on premium vinyl.", basePrice: "0.16", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 750, templateHeight: 750, printWidthInches: "2.500", printHeightInches: "2.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 283, categoryId: 29, name: "3\" Square Stickers", slug: "3-inch-square-stickers", description: "High-quality 3\" square stickers printed on premium vinyl.", basePrice: "0.17", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 900, printWidthInches: "3.000", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 284, categoryId: 29, name: "3.5\" Square Stickers", slug: "3-5-inch-square-stickers", description: "High-quality 3.5\" square stickers printed on premium vinyl.", basePrice: "0.18", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1050, templateHeight: 1050, printWidthInches: "3.500", printHeightInches: "3.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 285, categoryId: 29, name: "4\" Square Stickers", slug: "4-inch-square-stickers", description: "High-quality 4\" square stickers printed on premium vinyl.", basePrice: "0.19", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1200, templateHeight: 1200, printWidthInches: "4.000", printHeightInches: "4.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 286, categoryId: 29, name: "1x2\" Rectangle Stickers", slug: "1x2-inch-rectangle-stickers", description: "High-quality 1x2\" rectangle stickers printed on premium vinyl.", basePrice: "0.14", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 300, templateHeight: 600, printWidthInches: "1.000", printHeightInches: "2.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 287, categoryId: 29, name: "1.5x3\" Rectangle Stickers", slug: "1-5x3-inch-rectangle-stickers", description: "High-quality 1.5x3\" rectangle stickers printed on premium vinyl.", basePrice: "0.16", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 450, templateHeight: 900, printWidthInches: "1.500", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 288, categoryId: 29, name: "2x3\" Rectangle Stickers", slug: "2x3-inch-rectangle-stickers", description: "High-quality 2x3\" rectangle stickers printed on premium vinyl.", basePrice: "0.17", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 600, templateHeight: 900, printWidthInches: "2.000", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 289, categoryId: 29, name: "2x4\" Rectangle Stickers", slug: "2x4-inch-rectangle-stickers", description: "High-quality 2x4\" rectangle stickers printed on premium vinyl.", basePrice: "0.18", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 600, templateHeight: 1200, printWidthInches: "2.000", printHeightInches: "4.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 290, categoryId: 29, name: "3x4\" Rectangle Stickers", slug: "3x4-inch-rectangle-stickers", description: "High-quality 3x4\" rectangle stickers printed on premium vinyl.", basePrice: "0.20", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 1200, printWidthInches: "3.000", printHeightInches: "4.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 291, categoryId: 29, name: "3x5\" Rectangle Stickers", slug: "3x5-inch-rectangle-stickers", description: "High-quality 3x5\" rectangle stickers printed on premium vinyl.", basePrice: "0.21", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 1500, printWidthInches: "3.000", printHeightInches: "5.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 292, categoryId: 29, name: "4x5\" Rectangle Stickers", slug: "4x5-inch-rectangle-stickers", description: "High-quality 4x5\" rectangle stickers printed on premium vinyl.", basePrice: "0.22", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1200, templateHeight: 1500, printWidthInches: "4.000", printHeightInches: "5.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 293, categoryId: 29, name: "4x6\" Rectangle Stickers", slug: "4x6-inch-rectangle-stickers", description: "High-quality 4x6\" rectangle stickers printed on premium vinyl.", basePrice: "0.23", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1200, templateHeight: 1800, printWidthInches: "4.000", printHeightInches: "6.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 294, categoryId: 29, name: "5x7\" Rectangle Stickers", slug: "5x7-inch-rectangle-stickers", description: "High-quality 5x7\" rectangle stickers printed on premium vinyl.", basePrice: "0.25", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1500, templateHeight: 2100, printWidthInches: "5.000", printHeightInches: "7.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 295, categoryId: 29, name: "6x8\" Rectangle Stickers", slug: "6x8-inch-rectangle-stickers", description: "High-quality 6x8\" rectangle stickers printed on premium vinyl.", basePrice: "0.28", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 1800, templateHeight: 2400, printWidthInches: "6.000", printHeightInches: "8.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 296, categoryId: 28, name: "2.5x2.5\" Circle Stickers", slug: "2-5x2-5-inch-circle-stickers", description: "High-quality 2.5\" circle stickers - popular bumper sticker size.", basePrice: "0.16", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 750, templateHeight: 750, printWidthInches: "2.500", printHeightInches: "2.500", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 297, categoryId: 28, name: "3x3\" Circle Stickers", slug: "3x3-inch-circle-stickers", description: "High-quality 3\" circle stickers - classic bumper sticker size.", basePrice: "0.17", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 900, printWidthInches: "3.000", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 298, categoryId: 29, name: "2x2\" Square Stickers", slug: "2x2-inch-square-stickers", description: "High-quality 2x2\" square stickers - perfect for logos and icons.", basePrice: "0.15", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 600, templateHeight: 600, printWidthInches: "2.000", printHeightInches: "2.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false },
    { id: 299, categoryId: 29, name: "3x3\" Square Stickers", slug: "3x3-inch-square-stickers", description: "High-quality 3x3\" square stickers - versatile size for branding.", basePrice: "0.17", minQuantity: 1, isActive: true, isFeatured: false, templateWidth: 900, templateHeight: 900, printWidthInches: "3.000", printHeightInches: "3.000", printDpi: 300, bleedSize: "0.125", safeZoneSize: "0.250", supportsCustomShape: false, shippingType: "calculated", useGlobalTiers: false, isDealProduct: false }
  ]
};

function generatePricingTiers(productId: number, basePrice: string) {
  const base = parseFloat(basePrice);
  return [
    { productId, minQuantity: 1, maxQuantity: 249, pricePerUnit: base.toFixed(2) },
    { productId, minQuantity: 250, maxQuantity: 999, pricePerUnit: (base * 0.90).toFixed(2) },
    { productId, minQuantity: 1000, maxQuantity: 1999, pricePerUnit: (base * 0.85).toFixed(2) },
    { productId, minQuantity: 2000, maxQuantity: null, pricePerUnit: (base * 0.80).toFixed(2) }
  ];
}

const MATERIAL_OPTIONS = ['Vinyl', 'Foil', 'Holographic'];
const FINISH_OPTIONS = ['None', 'Varnish', 'Emboss', 'Both', 'Gloss'];

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');
    
    if (secretKey !== 'sync-sticky-data-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      categories: 0,
      products: 0,
      pricingTiers: 0,
      productOptions: 0
    };

    // Sync categories
    for (const cat of SEED_DATA.categories) {
      const existing = await db.select().from(categories).where(eq(categories.id, cat.id));
      if (existing.length === 0) {
        await db.insert(categories).values(cat);
        results.categories++;
      }
    }

    // Sync products
    for (const prod of SEED_DATA.products) {
      const existing = await db.select().from(products).where(eq(products.id, prod.id));
      if (existing.length === 0) {
        await db.insert(products).values(prod as any);
        results.products++;

        // Create pricing tiers
        const tiers = generatePricingTiers(prod.id, prod.basePrice);
        for (const tier of tiers) {
          await db.insert(pricingTiers).values(tier);
          results.pricingTiers++;
        }

        // Create material options
        for (const material of MATERIAL_OPTIONS) {
          await db.insert(productOptions).values({
            productId: prod.id,
            name: material,
            optionType: 'material',
            priceModifier: '0.00'
          });
          results.productOptions++;
        }

        // Create finish options
        for (const finish of FINISH_OPTIONS) {
          await db.insert(productOptions).values({
            productId: prod.id,
            name: finish,
            optionType: 'coating',
            priceModifier: '0.00'
          });
          results.productOptions++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data sync completed',
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secretKey = searchParams.get('key');
  
  if (secretKey !== 'sync-sticky-data-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allCats = await db.select().from(categories);
  const allProds = await db.select().from(products);
  const tierCount = await db.select().from(pricingTiers);
  const optCount = await db.select().from(productOptions);

  // Check active vs inactive products
  const activeProducts = allProds.filter(p => p.isActive === true);
  const inactiveProducts = allProds.filter(p => p.isActive !== true);

  return NextResponse.json({
    categories: allCats.length,
    products: allProds.length,
    activeProducts: activeProducts.length,
    inactiveProducts: inactiveProducts.length,
    pricingTiers: tierCount.length,
    productOptions: optCount.length,
    sampleProducts: allProds.slice(0, 3).map(p => ({ id: p.id, name: p.name, isActive: p.isActive, categoryId: p.categoryId }))
  });
}

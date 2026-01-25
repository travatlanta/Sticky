import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productOptions } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

const DEFAULT_MATERIAL_OPTIONS = [
  { optionType: 'material' as const, name: 'Vinyl', value: 'vinyl', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'material' as const, name: 'Foil', value: 'foil', priceModifier: '0.20', isDefault: false, displayOrder: 2 },
  { optionType: 'material' as const, name: 'Holographic', value: 'holographic', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
];

const DEFAULT_COATING_OPTIONS = [
  { optionType: 'coating' as const, name: 'None', value: 'none', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'coating' as const, name: 'Varnish', value: 'varnish', priceModifier: '0.10', isDefault: false, displayOrder: 2 },
  { optionType: 'coating' as const, name: 'Emboss', value: 'emboss', priceModifier: '0.00', isDefault: false, displayOrder: 3 },
  { optionType: 'coating' as const, name: 'Both', value: 'both', priceModifier: '0.10', isDefault: false, displayOrder: 4 },
];

const DEFAULT_CUT_OPTIONS = [
  { optionType: 'cut' as const, name: 'Standard', value: 'Kiss cut - stickers are cut through the vinyl but not the backing paper. Easy to peel.', priceModifier: '0.00', isDefault: true, displayOrder: 1 },
  { optionType: 'cut' as const, name: 'Die Cut', value: 'Stickers are cut completely through both vinyl and backing to your exact shape.', priceModifier: '0.00', isDefault: false, displayOrder: 2 },
];

async function normalizeProductOptions() {
  try {
    const allProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products);

    if (allProducts.length === 0) {
      return NextResponse.json({ message: "No products found", productsUpdated: 0 });
    }

    const productIds = allProducts.map(p => p.id);

    const existingOptions = await db
      .select({
        productId: productOptions.productId,
        optionType: productOptions.optionType,
      })
      .from(productOptions)
      .where(inArray(productOptions.productId, productIds));

    const optionsByProduct: Record<number, Set<string>> = {};
    for (const opt of existingOptions) {
      if (!optionsByProduct[opt.productId]) {
        optionsByProduct[opt.productId] = new Set();
      }
      optionsByProduct[opt.productId].add(opt.optionType);
    }

    const optionsToInsert: any[] = [];
    const updatedProducts: string[] = [];

    for (const product of allProducts) {
      const existingTypes = optionsByProduct[product.id] || new Set();
      let needsUpdate = false;

      if (!existingTypes.has('material')) {
        for (const opt of DEFAULT_MATERIAL_OPTIONS) {
          optionsToInsert.push({
            ...opt,
            productId: product.id,
            isActive: true,
          });
        }
        needsUpdate = true;
      }

      if (!existingTypes.has('coating')) {
        for (const opt of DEFAULT_COATING_OPTIONS) {
          optionsToInsert.push({
            ...opt,
            productId: product.id,
            isActive: true,
          });
        }
        needsUpdate = true;
      }

      if (!existingTypes.has('cut')) {
        for (const opt of DEFAULT_CUT_OPTIONS) {
          optionsToInsert.push({
            ...opt,
            productId: product.id,
            isActive: true,
          });
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        updatedProducts.push(product.name);
      }
    }

    if (optionsToInsert.length === 0) {
      return NextResponse.json({
        message: "All products already have Material, Coating, and Cut options",
        productsUpdated: 0,
      });
    }

    await db.insert(productOptions).values(optionsToInsert);

    return NextResponse.json({
      message: `Added missing options to ${updatedProducts.length} products`,
      productsUpdated: updatedProducts.length,
      optionsAdded: optionsToInsert.length,
      products: updatedProducts,
    });

  } catch (error) {
    console.error('Error normalizing product options:', error);
    return NextResponse.json(
      { error: 'Failed to normalize product options', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return normalizeProductOptions();
}

export async function GET() {
  return normalizeProductOptions();
}

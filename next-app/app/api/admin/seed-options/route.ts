export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const standardMaterials = [
  { name: "Vinyl", value: "vinyl", priceModifier: "0.00", isDefault: true, displayOrder: 1 },
  { name: "Foil", value: "foil", priceModifier: "0.00", isDefault: false, displayOrder: 2 },
  { name: "Holographic", value: "holographic", priceModifier: "0.00", isDefault: false, displayOrder: 3 },
];

const standardCoatings = [
  { name: "None", value: "none", priceModifier: "0.00", isDefault: true, displayOrder: 1 },
  { name: "Varnish", value: "varnish", priceModifier: "0.00", isDefault: false, displayOrder: 2 },
  { name: "Emboss", value: "emboss", priceModifier: "0.00", isDefault: false, displayOrder: 3 },
];

export async function POST(request: Request) {
  try {
    const allProducts = await db.select().from(products);
    
    let updatedCount = 0;
    const results: string[] = [];

    for (const product of allProducts) {
      // Delete existing material and coating options (to replace with correct ones)
      const existingOptions = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id));

      const existingMaterialIds = existingOptions
        .filter(o => o.optionType === 'material')
        .map(o => o.id);
      const existingCoatingIds = existingOptions
        .filter(o => o.optionType === 'coating')
        .map(o => o.id);

      // Delete old material options
      for (const id of existingMaterialIds) {
        await db.delete(productOptions).where(eq(productOptions.id, id));
      }
      // Delete old coating options
      for (const id of existingCoatingIds) {
        await db.delete(productOptions).where(eq(productOptions.id, id));
      }

      // Add new standard material options
      for (const mat of standardMaterials) {
        await db.insert(productOptions).values({
          productId: product.id,
          optionType: 'material',
          name: mat.name,
          value: mat.value,
          priceModifier: mat.priceModifier,
          isDefault: mat.isDefault,
          displayOrder: mat.displayOrder,
          isActive: true,
        });
      }

      // Add new standard coating (spot gloss) options
      for (const coat of standardCoatings) {
        await db.insert(productOptions).values({
          productId: product.id,
          optionType: 'coating',
          name: coat.name,
          value: coat.value,
          priceModifier: coat.priceModifier,
          isDefault: coat.isDefault,
          displayOrder: coat.displayOrder + 10,
          isActive: true,
        });
      }

      updatedCount++;
      results.push(`Updated options for: ${product.name}`);
    }

    return NextResponse.json({
      success: true,
      message: `Updated options for ${updatedCount} products`,
      details: results,
    });
  } catch (error) {
    console.error('Error seeding options:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allProducts = await db.select().from(products);
    const allOptions = await db.select().from(productOptions);

    const stats = {
      totalProducts: allProducts.length,
      productsWithMaterial: 0,
      productsWithCoating: 0,
      productsWithBoth: 0,
      productsMissingOptions: [] as string[],
    };

    for (const product of allProducts) {
      const productOpts = allOptions.filter(o => o.productId === product.id);
      const hasMaterial = productOpts.some(o => o.optionType === 'material');
      const hasCoating = productOpts.some(o => o.optionType === 'coating');

      if (hasMaterial) stats.productsWithMaterial++;
      if (hasCoating) stats.productsWithCoating++;
      if (hasMaterial && hasCoating) stats.productsWithBoth++;
      if (!hasMaterial || !hasCoating) {
        stats.productsMissingOptions.push(product.name);
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error checking options:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

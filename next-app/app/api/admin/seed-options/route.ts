export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const standardMaterials = [
  { name: "Gloss Vinyl", value: "gloss-vinyl", priceModifier: "0.00", isDefault: true, displayOrder: 1 },
  { name: "Matte Vinyl", value: "matte-vinyl", priceModifier: "0.00", isDefault: false, displayOrder: 2 },
  { name: "Clear Vinyl", value: "clear-vinyl", priceModifier: "0.03", isDefault: false, displayOrder: 3 },
];

const standardCoatings = [
  { name: "Standard", value: "standard", priceModifier: "0.00", isDefault: true, displayOrder: 1 },
  { name: "UV Lamination", value: "uv-lamination", priceModifier: "0.02", isDefault: false, displayOrder: 2 },
];

export async function POST(request: Request) {
  try {
    const allProducts = await db.select().from(products);
    
    let seededCount = 0;
    let skippedCount = 0;
    const results: string[] = [];

    for (const product of allProducts) {
      const existingOptions = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id));

      const hasMaterial = existingOptions.some(o => o.optionType === 'material');
      const hasCoating = existingOptions.some(o => o.optionType === 'coating');

      if (hasMaterial && hasCoating) {
        skippedCount++;
        continue;
      }

      if (!hasMaterial) {
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
        results.push(`Added materials to: ${product.name}`);
      }

      if (!hasCoating) {
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
        results.push(`Added coatings to: ${product.name}`);
      }

      seededCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded options for ${seededCount} products, skipped ${skippedCount} (already had options)`,
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

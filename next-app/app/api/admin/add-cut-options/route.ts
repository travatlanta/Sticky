import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productOptions } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

async function addCutOptions() {
  try {
    const allProducts = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.isActive, true));

    const productIds = allProducts.map(p => p.id);

    const existingOptions = await db
      .select({
        productId: productOptions.productId,
        optionType: productOptions.optionType,
      })
      .from(productOptions)
      .where(
        and(
          inArray(productOptions.productId, productIds),
          inArray(productOptions.optionType, ['material', 'coating', 'cut'])
        )
      );

    const optionsByProduct: Record<number, Set<string>> = {};
    for (const opt of existingOptions) {
      if (!optionsByProduct[opt.productId]) {
        optionsByProduct[opt.productId] = new Set();
      }
      optionsByProduct[opt.productId].add(opt.optionType);
    }

    const productsNeedingCut = allProducts.filter(p => {
      const opts = optionsByProduct[p.id];
      return opts && opts.has('material') && opts.has('coating') && !opts.has('cut');
    });

    if (productsNeedingCut.length === 0) {
      const allNeedCut = allProducts.filter(p => {
        const opts = optionsByProduct[p.id];
        return !opts || !opts.has('cut');
      });
      
      if (allNeedCut.length === 0) {
        return NextResponse.json({ 
          message: "All products already have cut options", 
          productsUpdated: 0 
        });
      }
      
      const cutOptionsToInsert = allNeedCut.flatMap(p => [
        {
          productId: p.id,
          optionType: 'cut' as const,
          name: 'Standard',
          value: 'Kiss cut - stickers are cut through the vinyl but not the backing paper. Easy to peel.',
          priceModifier: '0.00',
          isActive: true,
          isDefault: true,
          displayOrder: 1,
        },
        {
          productId: p.id,
          optionType: 'cut' as const,
          name: 'Die Cut',
          value: 'Stickers are cut completely through both vinyl and backing to your exact shape.',
          priceModifier: '0.00',
          isActive: true,
          isDefault: false,
          displayOrder: 2,
        },
      ]);

      await db.insert(productOptions).values(cutOptionsToInsert);

      return NextResponse.json({
        message: `Added cut options to ${allNeedCut.length} products`,
        productsUpdated: allNeedCut.length,
        products: allNeedCut.map(p => p.name),
      });
    }

    const cutOptionsToInsert = productsNeedingCut.flatMap(p => [
      {
        productId: p.id,
        optionType: 'cut' as const,
        name: 'Standard',
        value: 'Kiss cut - stickers are cut through the vinyl but not the backing paper. Easy to peel.',
        priceModifier: '0.00',
        isActive: true,
        isDefault: true,
        displayOrder: 1,
      },
      {
        productId: p.id,
        optionType: 'cut' as const,
        name: 'Die Cut',
        value: 'Stickers are cut completely through both vinyl and backing to your exact shape.',
        priceModifier: '0.00',
        isActive: true,
        isDefault: false,
        displayOrder: 2,
      },
    ]);

    await db.insert(productOptions).values(cutOptionsToInsert);

    return NextResponse.json({
      message: `Added cut options to ${productsNeedingCut.length} products`,
      productsUpdated: productsNeedingCut.length,
      products: productsNeedingCut.map(p => p.name),
    });

  } catch (error) {
    console.error('Error adding cut options:', error);
    return NextResponse.json(
      { error: 'Failed to add cut options', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return addCutOptions();
}

export async function GET() {
  return addCutOptions();
}

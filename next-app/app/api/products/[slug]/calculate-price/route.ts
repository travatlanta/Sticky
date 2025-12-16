export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers } from '@shared/schema';
import { eq, asc } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { quantity, selectedOptions } = body;

    // Check if slug is numeric (productId) or string (actual slug)
    const isNumeric = /^\d+$/.test(slug);

    // Find product by slug or id
    const [product] = await db
      .select()
      .from(products)
      .where(isNumeric ? eq(products.id, parseInt(slug)) : eq(products.slug, slug));

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    const productId = product.id;

    // Get pricing tiers
    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, productId))
      .orderBy(asc(pricingTiers.minQuantity));

    // Get product options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId));

    // Find applicable pricing tier
    let pricePerUnit = parseFloat(product.basePrice);
    for (const tier of tiers) {
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        pricePerUnit = parseFloat(tier.pricePerUnit);
        break;
      }
    }

    // Add option modifiers and collect itemized add-ons
    let optionsCost = 0;
    const addOns: { type: string; name: string; pricePerUnit: number; totalCost: number }[] = [];
    
    if (selectedOptions) {
      for (const [optionType, optionId] of Object.entries(selectedOptions)) {
        const option = options.find((o) => o.id === optionId);
        if (option && option.priceModifier) {
          const modifier = parseFloat(option.priceModifier);
          if (modifier > 0) {
            optionsCost += modifier;
            addOns.push({
              type: option.optionType,
              name: option.name,
              pricePerUnit: modifier,
              totalCost: modifier * quantity,
            });
          }
        }
      }
    }

    const subtotal = (pricePerUnit + optionsCost) * quantity;
    const baseSubtotal = pricePerUnit * quantity;

    return NextResponse.json({
      pricePerUnit,
      optionsCost,
      quantity,
      subtotal,
      baseSubtotal,
      addOns,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ message: 'Failed to calculate price' }, { status: 500 });
  }
}

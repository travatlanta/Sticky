import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers } from '../../../../../shared/schema';
import { eq, asc } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { quantity, selectedOptions } = body;

    // Find product by slug
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug));

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

    // Add option modifiers
    let optionsCost = 0;
    if (selectedOptions) {
      for (const optionId of Object.values(selectedOptions)) {
        const option = options.find((o) => o.id === optionId);
        if (option && option.priceModifier) {
          optionsCost += parseFloat(option.priceModifier);
        }
      }
    }

    const subtotal = (pricePerUnit + optionsCost) * quantity;

    return NextResponse.json({
      pricePerUnit,
      optionsCost,
      quantity,
      subtotal,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ message: 'Failed to calculate price' }, { status: 500 });
  }
}

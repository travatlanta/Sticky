export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers, globalPricingTiers } from '@shared/schema';
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
    const useGlobalTiers = product.useGlobalTiers ?? true;
    
    // DEAL PRODUCT ENFORCEMENT: If this is a deal product, use fixed quantity and price
    const isDealProduct = product.isDealProduct ?? false;
    const fixedQuantity = product.fixedQuantity;
    const fixedPrice = product.fixedPrice ? parseFloat(product.fixedPrice) : null;
    
    // For deal products, override quantity with fixed quantity
    const effectiveQuantity = isDealProduct && fixedQuantity ? fixedQuantity : quantity;
    
    // For deal products with fixed price, return fixed pricing immediately
    if (isDealProduct && fixedPrice !== null) {
      const pricePerUnit = fixedPrice / effectiveQuantity;
      return NextResponse.json({
        pricePerUnit,
        optionsCost: 0,
        quantity: effectiveQuantity,
        subtotal: fixedPrice,
        baseSubtotal: fixedPrice,
        addOns: [],
        isDealProduct: true,
        fixedQuantity: effectiveQuantity,
        fixedPrice,
      });
    }

    // Get product options
    const options = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, productId));

    // Find applicable pricing tier
    const basePrice = parseFloat(product.basePrice);
    let pricePerUnit = basePrice;
    let appliedTierDiscount = 0; // Discount percentage to apply to options too
    
    if (useGlobalTiers) {
      // Use global tier discount percentages
      const globalTiers = await db
        .select()
        .from(globalPricingTiers)
        .where(eq(globalPricingTiers.isActive, true))
        .orderBy(asc(globalPricingTiers.minQuantity));
      
      for (const tier of globalTiers) {
        if (effectiveQuantity >= tier.minQuantity && (!tier.maxQuantity || effectiveQuantity <= tier.maxQuantity)) {
          // Apply discount percentage to base price
          appliedTierDiscount = parseFloat(tier.discountPercent) / 100;
          pricePerUnit = basePrice * (1 - appliedTierDiscount);
          break;
        }
      }
    } else {
      // Use custom product-specific tier pricing
      const tiers = await db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.productId, productId))
        .orderBy(asc(pricingTiers.minQuantity));
      
      for (const tier of tiers) {
        if (effectiveQuantity >= tier.minQuantity && (!tier.maxQuantity || effectiveQuantity <= tier.maxQuantity)) {
          pricePerUnit = parseFloat(tier.pricePerUnit);
          // Calculate discount percentage: (basePrice - tierPrice) / basePrice
          if (basePrice > 0) {
            appliedTierDiscount = Math.max(0, (basePrice - pricePerUnit) / basePrice);
          }
          break;
        }
      }
    }

    // Add option modifiers and collect itemized add-ons
    // Apply the same tier discount percentage to option prices
    let optionsCost = 0;
    let optionsSavings = 0; // Track how much customer saves on options
    const addOns: { type: string; name: string; pricePerUnit: number; originalPrice: number; totalCost: number; savings: number }[] = [];
    
    if (selectedOptions) {
      for (const [optionType, optionId] of Object.entries(selectedOptions)) {
        const option = options.find((o) => o.id === optionId);
        if (option && option.priceModifier) {
          const originalModifier = parseFloat(option.priceModifier);
          if (originalModifier > 0) {
            // Apply tier discount to option price
            const discountedModifier = originalModifier * (1 - appliedTierDiscount);
            const savingsPerUnit = originalModifier - discountedModifier;
            
            optionsCost += discountedModifier;
            optionsSavings += savingsPerUnit * effectiveQuantity;
            
            addOns.push({
              type: option.optionType,
              name: option.name,
              pricePerUnit: discountedModifier,
              originalPrice: originalModifier,
              totalCost: discountedModifier * effectiveQuantity,
              savings: savingsPerUnit * effectiveQuantity,
            });
          }
        }
      }
    }

    const subtotal = (pricePerUnit + optionsCost) * effectiveQuantity;
    const baseSubtotal = pricePerUnit * effectiveQuantity;
    
    // Calculate total savings (base price savings + options savings)
    const baseSavings = (basePrice - pricePerUnit) * effectiveQuantity;
    const totalSavings = baseSavings + optionsSavings;

    return NextResponse.json({
      pricePerUnit,
      optionsCost,
      quantity: effectiveQuantity,
      subtotal,
      baseSubtotal,
      addOns,
      isDealProduct,
      fixedQuantity: isDealProduct ? effectiveQuantity : null,
      fixedPrice: isDealProduct ? fixedPrice : null,
      // New fields for showing savings
      discountPercentage: appliedTierDiscount > 0 ? Math.round(appliedTierDiscount * 100) : 0,
      baseSavings,
      optionsSavings,
      totalSavings,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ message: 'Failed to calculate price' }, { status: 500 });
  }
}

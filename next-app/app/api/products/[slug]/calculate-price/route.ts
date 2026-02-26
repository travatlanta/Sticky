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
    let appliedTierAdjustment = 0; // Positive = surcharge, negative = discount
    let matchedTierForUi: { minQuantity: number; maxQuantity: number | null; adjustmentType: 'discount' | 'surcharge' | 'none'; adjustmentPercent: number } | null = null;
    let displayTiers: Array<{ minQuantity: number; maxQuantity: number | null; pricePerUnit: number; isSurcharge: boolean; adjustmentPercent: number }> = [];
    
    // Use product-specific tier pricing
    const tiers = await db
      .select()
      .from(pricingTiers)
      .where(eq(pricingTiers.productId, productId))
      .orderBy(asc(pricingTiers.minQuantity));
    
    for (const tier of tiers) {
      if (effectiveQuantity >= tier.minQuantity && (!tier.maxQuantity || effectiveQuantity <= tier.maxQuantity)) {
        pricePerUnit = parseFloat(tier.pricePerUnit);
        // Calculate signed adjustment percentage relative to base price
        if (basePrice > 0) {
          appliedTierAdjustment = (pricePerUnit - basePrice) / basePrice;
        }
        matchedTierForUi = {
          minQuantity: tier.minQuantity,
          maxQuantity: tier.maxQuantity,
          adjustmentType: appliedTierAdjustment > 0 ? 'surcharge' : appliedTierAdjustment < 0 ? 'discount' : 'none',
          adjustmentPercent: Math.round(Math.abs(appliedTierAdjustment) * 100),
        };
        break;
      }
    }

    displayTiers = tiers.map((tier) => {
      const tierPrice = parseFloat(tier.pricePerUnit);
      const signedAdjustment = basePrice > 0 ? (tierPrice - basePrice) / basePrice : 0;
      return {
        minQuantity: tier.minQuantity,
        maxQuantity: tier.maxQuantity,
        pricePerUnit: tierPrice,
        isSurcharge: signedAdjustment > 0,
        adjustmentPercent: Math.round(Math.abs(signedAdjustment) * 100),
      };
    });

    // Determine which tier number applies (for tier-specific option pricing)
    let appliedTierNumber = 1; // Default to tier 1
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      if (effectiveQuantity >= tier.minQuantity && (!tier.maxQuantity || effectiveQuantity <= tier.maxQuantity)) {
        appliedTierNumber = i + 1; // 1-indexed tier number
        break;
      }
    }

    // Add option modifiers and collect itemized add-ons
    // For custom tiers: Use tier-specific option pricing if available
    // For global tiers: Apply the discount percentage to option prices
    let optionsCost = 0;
    let optionsSavings = 0; // Track how much customer saves on options
    const addOns: { type: string; name: string; pricePerUnit: number; originalPrice: number; totalCost: number; savings: number }[] = [];
    
    if (selectedOptions) {
      for (const [_optionType, optionId] of Object.entries(selectedOptions)) {
        const option = options.find((o) => o.id === optionId);
        if (option) {
          const originalModifier = parseFloat(option.priceModifier || '0');
          let effectiveModifier = originalModifier;
          
          // Use tier-specific option pricing if available (independent of base modifier)
          if (appliedTierNumber === 2 && option.tier2PriceModifier !== null) {
            effectiveModifier = parseFloat(option.tier2PriceModifier);
          } else if (appliedTierNumber === 3 && option.tier3PriceModifier !== null) {
            effectiveModifier = parseFloat(option.tier3PriceModifier);
          } else if (appliedTierNumber === 4 && option.tier4PriceModifier !== null) {
            effectiveModifier = parseFloat(option.tier4PriceModifier);
          } else if (appliedTierNumber === 5 && option.tier5PriceModifier !== null) {
            effectiveModifier = parseFloat(option.tier5PriceModifier);
          } else if (appliedTierNumber === 6 && option.tier6PriceModifier !== null) {
            effectiveModifier = parseFloat(option.tier6PriceModifier);
          }
          // Otherwise falls back to base priceModifier
          
          // Only add to cost if there's an actual price
          if (effectiveModifier > 0 || originalModifier > 0) {
            const savingsPerUnit = Math.max(0, originalModifier - effectiveModifier);
            
            optionsCost += effectiveModifier;
            optionsSavings += savingsPerUnit * effectiveQuantity;
            
            addOns.push({
              type: option.optionType,
              name: option.name,
              pricePerUnit: effectiveModifier,
              originalPrice: originalModifier,
              totalCost: effectiveModifier * effectiveQuantity,
              savings: savingsPerUnit * effectiveQuantity,
            });
          }
        }
      }
    }

    const subtotal = (pricePerUnit + optionsCost) * effectiveQuantity;
    const baseSubtotal = pricePerUnit * effectiveQuantity;
    
    // Calculate total savings (base price savings + options savings)
    const baseSavings = Math.max(0, (basePrice - pricePerUnit) * effectiveQuantity);
    const totalSavings = baseSavings + optionsSavings;
    const surchargePerUnit = Math.max(0, pricePerUnit - basePrice);
    const surchargeTotal = surchargePerUnit * effectiveQuantity;

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
      discountPercentage: appliedTierAdjustment < 0 ? Math.round(Math.abs(appliedTierAdjustment) * 100) : 0,
      surchargePercentage: appliedTierAdjustment > 0 ? Math.round(appliedTierAdjustment * 100) : 0,
      surchargeTotal,
      surchargePerUnit,
      isSurchargeApplied: appliedTierAdjustment > 0,
      matchedTier: matchedTierForUi,
      displayTiers,
      baseSavings,
      optionsSavings,
      totalSavings,
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json({ message: 'Failed to calculate price' }, { status: 500 });
  }
}

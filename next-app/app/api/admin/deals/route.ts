export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals, products, productOptions, pricingTiers } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allDeals = await db.select().from(deals);
    return NextResponse.json(allDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ message: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    let dealProductId: number | null = null;
    let linkUrl = body.linkUrl;
    
    // If sourceProductId is provided, duplicate the product
    if (body.sourceProductId) {
      // Get the source product
      const [sourceProduct] = await db
        .select()
        .from(products)
        .where(eq(products.id, body.sourceProductId));
      
      if (!sourceProduct) {
        return NextResponse.json({ message: 'Source product not found' }, { status: 404 });
      }
      
      // Create a duplicate product with deal-specific settings
      const dealSlug = `deal-${sourceProduct.slug}-${Date.now()}`;
      const [newProduct] = await db
        .insert(products)
        .values({
          categoryId: sourceProduct.categoryId,
          name: `${body.title} - ${sourceProduct.name}`,
          slug: dealSlug,
          description: sourceProduct.description,
          thumbnailUrl: body.imageUrl || sourceProduct.thumbnailUrl,
          basePrice: body.dealPrice,
          minQuantity: body.quantity || sourceProduct.minQuantity,
          isActive: true,
          isFeatured: false,
          printWidthInches: sourceProduct.printWidthInches,
          printHeightInches: sourceProduct.printHeightInches,
          printDpi: sourceProduct.printDpi,
          templateWidth: sourceProduct.templateWidth,
          templateHeight: sourceProduct.templateHeight,
          bleedSize: sourceProduct.bleedSize,
          safeZoneSize: sourceProduct.safeZoneSize,
          supportsCustomShape: sourceProduct.supportsCustomShape,
          shippingType: sourceProduct.shippingType,
          flatShippingPrice: sourceProduct.flatShippingPrice,
          metaTitle: body.title,
          metaDescription: body.description,
          // Deal-specific fields
          isDealProduct: true,
          fixedQuantity: body.quantity || null,
          fixedPrice: body.dealPrice,
          sourceProductId: body.sourceProductId,
        })
        .returning();
      
      dealProductId = newProduct.id;
      linkUrl = `/products/${dealSlug}`;
      
      // Copy product options from source product
      const sourceOptions = await db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, body.sourceProductId));
      
      if (sourceOptions.length > 0) {
        await db.insert(productOptions).values(
          sourceOptions.map(opt => ({
            productId: newProduct.id,
            optionType: opt.optionType,
            name: opt.name,
            value: opt.value,
            priceModifier: opt.priceModifier,
            isDefault: opt.isDefault,
            isActive: opt.isActive,
            displayOrder: opt.displayOrder,
          }))
        );
      }
      
      // Copy pricing tiers from source product (but with fixed price for deals)
      const sourceTiers = await db
        .select()
        .from(pricingTiers)
        .where(eq(pricingTiers.productId, body.sourceProductId));
      
      if (sourceTiers.length > 0) {
        await db.insert(pricingTiers).values(
          sourceTiers.map(tier => ({
            productId: newProduct.id,
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity,
            pricePerUnit: tier.pricePerUnit,
          }))
        );
      }
    }

    const [deal] = await db
      .insert(deals)
      .values({
        title: body.title,
        description: body.description,
        originalPrice: body.originalPrice,
        dealPrice: body.dealPrice,
        imageUrl: body.imageUrl,
        quantity: body.quantity,
        productSize: body.productSize,
        productType: body.productType,
        linkUrl: linkUrl,
        sourceProductId: body.sourceProductId || null,
        dealProductId: dealProductId,
        badgeText: body.badgeText,
        badgeColor: body.badgeColor || 'yellow',
        ctaText: 'Buy Now',
        displayOrder: body.displayOrder || 0,
        isActive: body.isActive ?? true,
        showOnHomepage: body.showOnHomepage ?? false,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      .returning();
    
    // Update the deal product with the deal ID
    if (dealProductId) {
      await db
        .update(products)
        .set({ dealId: deal.id })
        .where(eq(products.id, dealProductId));
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ message: 'Failed to create deal' }, { status: 500 });
  }
}

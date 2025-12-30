export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allProducts = await db.select().from(products);
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
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

    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Derive shipping values with sensible defaults.  If a shippingType is not
    // provided, default to 'calculated'.  If a flatShippingPrice is provided as
    // an empty string or undefined, coerce it to null so the database can store
    // a null value.  When shippingType is 'flat', the client should pass
    // flatShippingPrice explicitly.
    const shippingType = body.shippingType || 'calculated';
    const flatShippingPrice = body.flatShippingPrice === '' || body.flatShippingPrice === undefined
      ? null
      : body.flatShippingPrice;

    // Calculate template dimensions from print size (inches * 300 DPI)
    const printWidthInches = parseFloat(body.printWidthInches) || 4;
    const printHeightInches = parseFloat(body.printHeightInches) || 4;
    const templateWidth = Math.round(printWidthInches * 300);
    const templateHeight = Math.round(printHeightInches * 300);

    const [product] = await db
      .insert(products)
      .values({
        name: body.name,
        slug: slug,
        description: body.description,
        categoryId: body.categoryId,
        basePrice: body.basePrice,
        thumbnailUrl: body.thumbnailUrl,
        minQuantity: body.minQuantity || 1,
        isActive: body.isActive ?? true,
        isFeatured: body.isFeatured ?? false,
        // Canvas dimensions (pixels)
        templateWidth: templateWidth || 1200,
        templateHeight: templateHeight || 1200,
        // Determine if custom shape is supported based on sticker type
        supportsCustomShape: body.stickerType && body.stickerType !== 'standard',
        shippingType: shippingType,
        flatShippingPrice: flatShippingPrice,
      })
      .returning();

    // Automatically add default material and coating options for all new products
    const allDefaultOptions = [...DEFAULT_MATERIAL_OPTIONS, ...DEFAULT_COATING_OPTIONS].map(opt => ({
      ...opt,
      productId: product.id,
      isActive: true,
    }));

    await db.insert(productOptions).values(allDefaultOptions);

    // Add bulk pricing tiers (using min/max quantity and direct price per unit)
    if (body.pricingTiers && Array.isArray(body.pricingTiers) && body.pricingTiers.length > 0) {
      // Filter out empty tiers (must have minQuantity and pricePerUnit)
      const customTiers = body.pricingTiers
        .filter((t: any) => t.minQuantity && t.pricePerUnit)
        .sort((a: any, b: any) => parseInt(a.minQuantity) - parseInt(b.minQuantity));
      
      for (const tier of customTiers) {
        const minQty = parseInt(tier.minQuantity);
        const maxQty = tier.maxQuantity ? parseInt(tier.maxQuantity) : null;
        const pricePerUnit = parseFloat(tier.pricePerUnit);
        
        await db.insert(pricingTiers).values({
          productId: product.id,
          minQuantity: minQty,
          maxQuantity: maxQty,
          pricePerUnit: pricePerUnit.toFixed(4),
        });
      }
    }
    // No default tiers - admin must set them explicitly

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Failed to create product' }, { status: 500 });
  }
}

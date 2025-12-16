export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Derive shipping values.  Default shippingType to the existing value
    // ('calculated') if not provided.  Coerce empty string or undefined
    // flatShippingPrice to null.  When shippingType is 'flat', clients should
    // provide flatShippingPrice.
    const shippingType = body.shippingType || 'calculated';
    const flatShippingPrice = body.flatShippingPrice === '' || body.flatShippingPrice === undefined
      ? null
      : body.flatShippingPrice;

    // Calculate template dimensions from print size if provided
    let templateWidth = body.templateWidth;
    let templateHeight = body.templateHeight;
    if (body.printWidthInches && body.printHeightInches && body.printDpi) {
      const printWidthInches = parseFloat(body.printWidthInches);
      const printHeightInches = parseFloat(body.printHeightInches);
      const printDpi = parseInt(body.printDpi);
      templateWidth = Math.round(printWidthInches * printDpi);
      templateHeight = Math.round(printHeightInches * printDpi);
    }

    const [product] = await db
      .update(products)
      .set({
        name: body.name,
        slug: body.slug,
        description: body.description,
        categoryId: body.categoryId,
        basePrice: body.basePrice,
        thumbnailUrl: body.thumbnailUrl,
        minQuantity: body.minQuantity,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        // Print dimensions
        printWidthInches: body.printWidthInches,
        printHeightInches: body.printHeightInches,
        printDpi: body.printDpi,
        templateWidth: templateWidth,
        templateHeight: templateHeight,
        bleedSize: body.bleedSize,
        safeZoneSize: body.safeZoneSize,
        supportsCustomShape: body.supportsCustomShape,
        shippingType: shippingType,
        flatShippingPrice: flatShippingPrice,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    await db.delete(products).where(eq(products.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
  }
}

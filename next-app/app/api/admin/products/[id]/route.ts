export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers, productImages, productTemplates, designs, cartItems, orderItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
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
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    
    // Check for force delete query param
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';

    // Check if product has any order items
    const existingOrderItems = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.productId, productId))
      .limit(1);

    if (existingOrderItems.length > 0 && !forceDelete) {
      // Soft delete: deactivate the product instead of deleting
      await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, productId));

      return NextResponse.json({ 
        success: true, 
        softDeleted: true,
        hasOrders: true,
        message: 'Product has existing orders and was deactivated instead of deleted. Use force delete to permanently remove.' 
      });
    }
    
    // If force delete with orders, delete order items first
    if (existingOrderItems.length > 0 && forceDelete) {
      console.log(`Force deleting product ${productId} - removing order items...`);
      await db.delete(orderItems).where(eq(orderItems.productId, productId));
    }

    // Delete related records first to avoid foreign key constraint violations
    console.log(`Deleting product ${productId} - removing related records...`);
    
    try {
      await db.delete(productOptions).where(eq(productOptions.productId, productId));
      console.log('Deleted product options');
    } catch (e) {
      console.error('Error deleting product options:', e);
    }
    
    try {
      await db.delete(pricingTiers).where(eq(pricingTiers.productId, productId));
      console.log('Deleted pricing tiers');
    } catch (e) {
      console.error('Error deleting pricing tiers:', e);
    }
    
    try {
      await db.delete(productImages).where(eq(productImages.productId, productId));
      console.log('Deleted product images');
    } catch (e) {
      console.error('Error deleting product images:', e);
    }
    
    try {
      await db.delete(productTemplates).where(eq(productTemplates.productId, productId));
      console.log('Deleted product templates');
    } catch (e) {
      console.error('Error deleting product templates:', e);
    }
    
    // Set productId to null for designs and delete cart items
    try {
      await db.update(designs).set({ productId: null }).where(eq(designs.productId, productId));
      console.log('Updated designs');
    } catch (e) {
      console.error('Error updating designs:', e);
    }
    
    try {
      await db.delete(cartItems).where(eq(cartItems.productId, productId));
      console.log('Deleted cart items');
    } catch (e) {
      console.error('Error deleting cart items:', e);
    }

    // Now delete the product
    await db.delete(products).where(eq(products.id, productId));
    console.log(`Product ${productId} deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ 
      message: 'Failed to delete product', 
      error: error?.message || 'Unknown error',
      detail: error?.detail || null
    }, { status: 500 });
  }
}

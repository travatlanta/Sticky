export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productOptions, pricingTiers, productImages, productTemplates, designs, cartItems, orderItems, artworkNotes } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';
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
    const productId = parseInt(id);

    // STEP 1: Fetch BEFORE state for comparison
    const [beforeProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));

    console.log(`\n========== PRODUCT UPDATE LOG (ID: ${id}) ==========`);
    console.log(`[UPDATE] Timestamp: ${new Date().toISOString()}`);
    console.log(`[UPDATE] Admin: ${(session.user as any).email || 'unknown'}`);
    
    // Log all incoming changes with BEFORE/AFTER comparison
    const changes: string[] = [];
    const compareField = (field: string, before: any, after: any) => {
      const beforeVal = before === null || before === undefined ? 'NULL' : 
        typeof before === 'string' && before.length > 60 ? before.substring(0, 60) + '...' : before;
      const afterVal = after === null || after === undefined ? 'NULL' : 
        typeof after === 'string' && after.length > 60 ? after.substring(0, 60) + '...' : after;
      
      if (String(beforeVal) !== String(afterVal)) {
        changes.push(`  ${field}: "${beforeVal}" → "${afterVal}"`);
        return true;
      }
      return false;
    };

    compareField('name', beforeProduct?.name, body.name);
    compareField('slug', beforeProduct?.slug, body.slug);
    compareField('description', beforeProduct?.description, body.description);
    compareField('categoryId', beforeProduct?.categoryId, body.categoryId);
    compareField('basePrice', beforeProduct?.basePrice, body.basePrice);
    compareField('thumbnailUrl', beforeProduct?.thumbnailUrl, body.thumbnailUrl);
    compareField('minQuantity', beforeProduct?.minQuantity, body.minQuantity);
    compareField('isActive', beforeProduct?.isActive, body.isActive);
    compareField('isFeatured', beforeProduct?.isFeatured, body.isFeatured);
    compareField('printWidthInches', beforeProduct?.printWidthInches, body.printWidthInches);
    compareField('printHeightInches', beforeProduct?.printHeightInches, body.printHeightInches);
    compareField('printDpi', beforeProduct?.printDpi, body.printDpi);
    compareField('bleedSize', beforeProduct?.bleedSize, body.bleedSize);
    compareField('safeZoneSize', beforeProduct?.safeZoneSize, body.safeZoneSize);
    compareField('supportsCustomShape', beforeProduct?.supportsCustomShape, body.supportsCustomShape);
    compareField('shippingType', beforeProduct?.shippingType, body.shippingType);
    compareField('flatShippingPrice', beforeProduct?.flatShippingPrice, body.flatShippingPrice);

    if (changes.length > 0) {
      console.log(`[UPDATE] CHANGES DETECTED (${changes.length} fields):`);
      changes.forEach(c => console.log(c));
    } else {
      console.log(`[UPDATE] NO CHANGES DETECTED - all values match`);
    }

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

    // STEP 3: Verify by re-fetching immediately after update
    const [afterProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    
    // Log verification with ALL editable fields (using normalized values)
    console.log(`[UPDATE] VERIFICATION - Confirming all fields saved correctly:`);
    const verifyFields = [
      { name: 'name', expected: body.name, actual: afterProduct?.name },
      { name: 'slug', expected: body.slug, actual: afterProduct?.slug },
      { name: 'description', expected: body.description?.substring(0, 40), actual: afterProduct?.description?.substring(0, 40) },
      { name: 'categoryId', expected: body.categoryId, actual: afterProduct?.categoryId },
      { name: 'basePrice', expected: body.basePrice, actual: afterProduct?.basePrice },
      { name: 'thumbnailUrl', expected: body.thumbnailUrl?.substring(0, 60), actual: afterProduct?.thumbnailUrl?.substring(0, 60) },
      { name: 'minQuantity', expected: body.minQuantity, actual: afterProduct?.minQuantity },
      { name: 'isActive', expected: body.isActive, actual: afterProduct?.isActive },
      { name: 'isFeatured', expected: body.isFeatured, actual: afterProduct?.isFeatured },
      { name: 'printWidthInches', expected: body.printWidthInches, actual: afterProduct?.printWidthInches },
      { name: 'printHeightInches', expected: body.printHeightInches, actual: afterProduct?.printHeightInches },
      { name: 'printDpi', expected: body.printDpi, actual: afterProduct?.printDpi },
      { name: 'templateWidth', expected: templateWidth, actual: afterProduct?.templateWidth },
      { name: 'templateHeight', expected: templateHeight, actual: afterProduct?.templateHeight },
      { name: 'bleedSize', expected: body.bleedSize, actual: afterProduct?.bleedSize },
      { name: 'safeZoneSize', expected: body.safeZoneSize, actual: afterProduct?.safeZoneSize },
      { name: 'supportsCustomShape', expected: body.supportsCustomShape, actual: afterProduct?.supportsCustomShape },
      { name: 'shippingType', expected: shippingType, actual: afterProduct?.shippingType },
      { name: 'flatShippingPrice', expected: flatShippingPrice, actual: afterProduct?.flatShippingPrice },
    ];

    let allVerified = true;
    verifyFields.forEach(({ name, expected, actual }) => {
      const match = String(expected ?? 'NULL') === String(actual ?? 'NULL');
      if (!match) {
        console.log(`  ❌ ${name}: MISMATCH! Expected "${expected}", Got "${actual}"`);
        allVerified = false;
      } else {
        console.log(`  ✓ ${name}: verified`);
      }
    });

    if (allVerified) {
      console.log(`[UPDATE] ✓ SUCCESS - All fields saved and verified correctly`);
    } else {
      console.log(`[UPDATE] ⚠ WARNING - Some fields may not have saved correctly`);
    }
    console.log(`========== END UPDATE LOG ==========\n`);

    return NextResponse.json(product);
  } catch (error) {
    console.error('[Product Update] Error updating product:', error);
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
    
    // If force delete with orders, delete artwork notes and order items first
    if (existingOrderItems.length > 0 && forceDelete) {
      console.log(`Force deleting product ${productId} - removing related order data...`);
      
      // Get all order item IDs for this product
      const orderItemsToDelete = await db
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(eq(orderItems.productId, productId));
      
      const orderItemIds = orderItemsToDelete.map(item => item.id);
      
      // Delete artwork notes that reference these order items first
      if (orderItemIds.length > 0) {
        try {
          await db.delete(artworkNotes).where(inArray(artworkNotes.orderItemId, orderItemIds));
          console.log(`Deleted artwork notes for ${orderItemIds.length} order items`);
        } catch (e) {
          console.error('Error deleting artwork notes:', e);
        }
      }
      
      // Now delete the order items
      await db.delete(orderItems).where(eq(orderItems.productId, productId));
      console.log(`Deleted order items for product ${productId}`);
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

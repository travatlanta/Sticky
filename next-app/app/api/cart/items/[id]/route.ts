export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cartItems } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Use specific columns to avoid cutType column issue in production
    const [item] = await db
      .update(cartItems)
      .set({
        quantity: body.quantity,
        selectedOptions: body.selectedOptions,
        unitPrice: body.unitPrice,
      })
      .where(eq(cartItems.id, parseInt(id)))
      .returning({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        designId: cartItems.designId,
        quantity: cartItems.quantity,
        selectedOptions: cartItems.selectedOptions,
        unitPrice: cartItems.unitPrice,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        createdAt: cartItems.createdAt,
      });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json({ message: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Build update object with only provided fields
    // Note: cutType temporarily disabled until production DB is updated
    const updateData: Record<string, any> = {};
    if (body.designId !== undefined) updateData.designId = body.designId;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.selectedOptions !== undefined) updateData.selectedOptions = body.selectedOptions;
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
    if (body.mediaType !== undefined) updateData.mediaType = body.mediaType;
    if (body.finishType !== undefined) updateData.finishType = body.finishType;

    // Use specific columns to avoid cutType column issue in production
    const [item] = await db
      .update(cartItems)
      .set(updateData)
      .where(eq(cartItems.id, parseInt(id)))
      .returning({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        designId: cartItems.designId,
        quantity: cartItems.quantity,
        selectedOptions: cartItems.selectedOptions,
        unitPrice: cartItems.unitPrice,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        createdAt: cartItems.createdAt,
      });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error patching cart item:', error);
    return NextResponse.json({ message: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db
      .delete(cartItems)
      .where(eq(cartItems.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json({ message: 'Failed to remove cart item' }, { status: 500 });
  }
}

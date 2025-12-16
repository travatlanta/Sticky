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
    
    const [item] = await db
      .update(cartItems)
      .set({
        quantity: body.quantity,
        selectedOptions: body.selectedOptions,
        unitPrice: body.unitPrice,
      })
      .where(eq(cartItems.id, parseInt(id)))
      .returning();

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
    const updateData: Record<string, any> = {};
    if (body.designId !== undefined) updateData.designId = body.designId;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.selectedOptions !== undefined) updateData.selectedOptions = body.selectedOptions;
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;

    const [item] = await db
      .update(cartItems)
      .set(updateData)
      .where(eq(cartItems.id, parseInt(id)))
      .returning();

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

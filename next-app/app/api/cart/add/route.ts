export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // TODO: Get userId from NextAuth session when fully integrated
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session-id')?.value || 'anonymous-session';

    // Find or create cart
    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db
        .insert(carts)
        .values({ sessionId })
        .returning();
    }

    // Add item to cart
    const [item] = await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        productId: body.productId,
        designId: body.designId || null,
        quantity: body.quantity || 1,
        selectedOptions: body.selectedOptions || null,
        unitPrice: body.unitPrice || null,
      })
      .returning();

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ message: 'Failed to add to cart' }, { status: 500 });
  }
}

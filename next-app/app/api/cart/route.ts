import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, designs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;
    
    if (!sessionId && !userId) {
      sessionId = randomUUID();
    }
    
    // Try to find cart by session ID
    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    // Create cart if it doesn't exist
    if (!cart) {
      [cart] = await db
        .insert(carts)
        .values({ sessionId })
        .returning();
    }

    // Get cart items
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    // Enrich cart items with product and design info
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        let design = null;
        if (item.designId) {
          const [d] = await db
            .select()
            .from(designs)
            .where(eq(designs.id, item.designId));
          design = d || null;
        }
        
        return { ...item, product, design };
      })
    );

    return NextResponse.json({ ...cart, items: enrichedItems });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ message: 'Failed to fetch cart' }, { status: 500 });
  }
}

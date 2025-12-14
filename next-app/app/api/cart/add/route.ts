export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, designs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

// GET handler for fetching the current cart.  This route ensures that
// anonymous users have a persistent cart by using a cookie-based session
// ID.  Authenticated users still share the same mechanism but can be
// distinguished by `userId` when that integration is complete.
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Use the cookie store to manage a per-user cart session.  We do not
    // `await` here because `cookies()` returns a synchronous interface.
    const cookieStore = cookies();
    // Attempt to read an existing cart session ID.  If there is no cart
    // session and no authenticated user, generate a new ID.  We always
    // guarantee that `sessionId` is defined before using it.  Finally, if
    // a new ID is generated, persist it back to the cookie so that future
    // requests share the same session.
    let sessionId = cookieStore.get('cart-session-id')?.value;
    if (!sessionId && !userId) {
      sessionId = randomUUID();
    }
    if (!sessionId) {
      sessionId = randomUUID();
    }
    // Persist the session ID in the cookie if it doesn't already exist.  Use
    // httpOnly and sameSite to mitigate XSS/CSRF attacks.
    if (!cookieStore.get('cart-session-id')) {
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
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
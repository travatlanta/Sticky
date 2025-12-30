export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, designs, productOptions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

function noCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function GET() {
  try {
    const cookieStore = cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;

    if (!sessionId) {
      sessionId = randomUUID();
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db.insert(carts).values({ sessionId }).returning();
    }

    const rawItems = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        selectedOptions: cartItems.selectedOptions,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        product: products,
        design: designs,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.cartId, cart.id));

    // Fetch product options for each unique product in the cart
    const productIds = [...new Set(rawItems.map(item => item.product?.id).filter(Boolean))];
    
    const allOptions = productIds.length > 0 
      ? await db
          .select()
          .from(productOptions)
          .where(eq(productOptions.isActive, true))
      : [];

    // Group options by product and type
    const optionsByProduct: Record<number, { material: any[]; coating: any[] }> = {};
    for (const opt of allOptions) {
      if (!optionsByProduct[opt.productId]) {
        optionsByProduct[opt.productId] = { material: [], coating: [] };
      }
      if (opt.optionType === 'material') {
        optionsByProduct[opt.productId].material.push({
          id: opt.id,
          name: opt.name,
          value: opt.value,
          priceModifier: opt.priceModifier,
          isDefault: opt.isDefault,
          displayOrder: opt.displayOrder,
        });
      } else if (opt.optionType === 'coating') {
        optionsByProduct[opt.productId].coating.push({
          id: opt.id,
          name: opt.name,
          value: opt.value,
          priceModifier: opt.priceModifier,
          isDefault: opt.isDefault,
          displayOrder: opt.displayOrder,
        });
      }
    }

    // Sort options by displayOrder
    for (const pid of Object.keys(optionsByProduct)) {
      optionsByProduct[Number(pid)].material.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      optionsByProduct[Number(pid)].coating.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }

    // Normalize items to ensure unitPrice is always a valid string (never null)
    const items = rawItems.map(item => {
      const productId = item.product?.id;
      const options = productId ? optionsByProduct[productId] : { material: [], coating: [] };
      return {
        ...item,
        unitPrice: item.unitPrice ?? '0',
        quantity: item.quantity ?? 1,
        materialOptions: options?.material || [],
        coatingOptions: options?.coating || [],
      };
    });

    // Calculate subtotal from items (including material/coating price modifiers)
    const subtotal = items.reduce((sum, item) => {
      const basePrice = parseFloat(item.unitPrice) || 0;
      
      // Find price modifiers for selected options
      let materialModifier = 0;
      let coatingModifier = 0;
      
      if (item.mediaType && item.materialOptions) {
        const selectedMaterial = item.materialOptions.find((opt: any) => opt.name === item.mediaType);
        if (selectedMaterial?.priceModifier) {
          materialModifier = parseFloat(selectedMaterial.priceModifier) || 0;
        }
      }
      
      if (item.finishType && item.coatingOptions) {
        const selectedCoating = item.coatingOptions.find((opt: any) => opt.name === item.finishType);
        if (selectedCoating?.priceModifier) {
          coatingModifier = parseFloat(selectedCoating.priceModifier) || 0;
        }
      }
      
      const totalPricePerUnit = basePrice + materialModifier + coatingModifier;
      return sum + (totalPricePerUnit * item.quantity);
    }, 0);

    // Shipping is free for now (can be configured later)
    const shipping = 0;
    
    // Total
    const total = subtotal + shipping;

    return noCache(NextResponse.json({ items, subtotal, shipping, total }));
  } catch (error) {
    console.error('Error fetching cart:', error);
    return noCache(NextResponse.json({ items: [] }));
  }
}

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    }

    const cookieStore = cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;

    if (!sessionId) {
      sessionId = randomUUID();
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId));

    if (!cart) {
      [cart] = await db.insert(carts).values({ sessionId }).returning();
    }

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

    return noCache(NextResponse.json(item));
  } catch (error) {
    console.error('Error adding to cart:', error);
    return noCache(NextResponse.json({ message: 'Failed to add to cart' }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return noCache(NextResponse.json({}));
}

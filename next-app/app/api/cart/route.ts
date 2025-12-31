export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, designs, productOptions, pricingTiers } from '@shared/schema';
import { eq, and, asc, inArray, or, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const CART_EXPIRY_DAYS = 60;

function noCache(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

async function getOrCreateCart(sessionId: string, userId?: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CART_EXPIRY_DAYS);
  
  try {
    // First, try to find existing cart by session ID
    const existingCarts = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionId, sessionId))
      .limit(1);
    
    if (existingCarts && existingCarts.length > 0) {
      const cart = existingCarts[0];
      // Update expiry
      await db.update(carts)
        .set({ expiresAt, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
      console.log('[Cart GET] Found existing cart by sessionId:', cart.id);
      return cart;
    }
    
    // If user is logged in, also check for user cart
    if (userId) {
      const userCarts = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, userId))
        .limit(1);
      
      if (userCarts && userCarts.length > 0) {
        const cart = userCarts[0];
        // Update sessionId to match client's sessionId
        await db.update(carts)
          .set({ sessionId, expiresAt, updatedAt: new Date() })
          .where(eq(carts.id, cart.id));
        console.log('[Cart GET] Found user cart, updated sessionId:', cart.id);
        return { ...cart, sessionId };
      }
    }
    
    // Create new cart
    const newCarts = await db.insert(carts).values({ 
      sessionId, 
      userId: userId || null,
      expiresAt 
    }).returning();
    
    if (newCarts && newCarts.length > 0) {
      console.log('[Cart GET] Created new cart:', newCarts[0].id);
      return newCarts[0];
    }
    
    throw new Error('Failed to create cart');
  } catch (error) {
    console.error('[Cart GET] Database error in getOrCreateCart:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Priority: header (case insensitive) > cookie > fallback cookie > generate new
    // Note: Headers in fetch API are case-insensitive per HTTP spec
    let sessionId = request.headers.get('x-cart-session-id') || request.headers.get('X-Cart-Session-Id') || '';
    if (!sessionId) {
      sessionId = cookieStore.get('cart-session-id')?.value || '';
    }
    if (!sessionId) {
      sessionId = cookieStore.get('guest_session_id')?.value || '';
    }
    
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    
    console.log('[Cart GET] Header Session:', request.headers.get('X-Cart-Session-Id'), '| Cookie Session:', cookieStore.get('cart-session-id')?.value, '| User ID:', userId || 'GUEST');

    if (!sessionId) {
      sessionId = randomUUID();
      console.log('[Cart GET] Generated new session ID:', sessionId);
    }

    const cart = await getOrCreateCart(sessionId, userId);
    console.log('[Cart GET] Using cart ID:', cart.id, '| Cart userId:', cart.userId, '| Cart sessionId:', cart.sessionId);

    const rawItems = await db
      .select({
        id: cartItems.id,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        selectedOptions: cartItems.selectedOptions,
        mediaType: cartItems.mediaType,
        finishType: cartItems.finishType,
        cutType: cartItems.cutType,
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
    const optionsByProduct: Record<number, { material: any[]; coating: any[]; cut: any[] }> = {};
    for (const opt of allOptions) {
      if (!optionsByProduct[opt.productId]) {
        optionsByProduct[opt.productId] = { material: [], coating: [], cut: [] };
      }
      if (opt.optionType === 'material') {
        optionsByProduct[opt.productId].material.push({
          id: opt.id,
          name: opt.name,
          value: opt.value,
          priceModifier: opt.priceModifier,
          isDefault: opt.isDefault,
          displayOrder: opt.displayOrder,
          description: opt.value,
        });
      } else if (opt.optionType === 'coating') {
        optionsByProduct[opt.productId].coating.push({
          id: opt.id,
          name: opt.name,
          value: opt.value,
          priceModifier: opt.priceModifier,
          isDefault: opt.isDefault,
          displayOrder: opt.displayOrder,
          description: opt.value,
        });
      } else if (opt.optionType === 'cut') {
        optionsByProduct[opt.productId].cut.push({
          id: opt.id,
          name: opt.name,
          value: opt.value,
          priceModifier: opt.priceModifier,
          isDefault: opt.isDefault,
          displayOrder: opt.displayOrder,
          description: opt.value,
        });
      }
    }

    // Sort options by displayOrder
    for (const pid of Object.keys(optionsByProduct)) {
      optionsByProduct[Number(pid)].material.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      optionsByProduct[Number(pid)].coating.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      optionsByProduct[Number(pid)].cut.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }

    // Fetch pricing tiers for bulk discounts
    const allTiers = productIds.length > 0
      ? await db
          .select()
          .from(pricingTiers)
          .where(inArray(pricingTiers.productId, productIds as number[]))
          .orderBy(asc(pricingTiers.minQuantity))
      : [];

    // Group pricing tiers by product
    const tiersByProduct: Record<number, typeof allTiers> = {};
    for (const tier of allTiers) {
      if (!tiersByProduct[tier.productId]) {
        tiersByProduct[tier.productId] = [];
      }
      tiersByProduct[tier.productId].push(tier);
    }

    // Helper to get bulk pricing for a product/quantity
    const getBulkPrice = (productId: number, quantity: number, basePrice: string): string => {
      const tiers = tiersByProduct[productId] || [];
      for (const tier of tiers) {
        if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
          return tier.pricePerUnit;
        }
      }
      return basePrice;
    };

    // Normalize items and apply bulk pricing based on quantity
    const items = rawItems.map(item => {
      const productId = item.product?.id;
      const options = productId ? optionsByProduct[productId] : { material: [], coating: [], cut: [] };
      const quantity = item.quantity ?? 1;
      
      // Apply bulk pricing if available
      const basePrice = item.product?.basePrice ?? '0';
      const bulkPrice = productId ? getBulkPrice(productId, quantity, basePrice) : basePrice;
      
      return {
        ...item,
        unitPrice: bulkPrice,
        quantity,
        materialOptions: options?.material || [],
        coatingOptions: options?.coating || [],
        cutOptions: options?.cut || [],
      };
    });

    // Calculate subtotal from items (including material/coating/cut price modifiers)
    const subtotal = items.reduce((sum, item) => {
      const basePrice = parseFloat(item.unitPrice) || 0;
      
      // Find price modifiers for selected options
      let materialModifier = 0;
      let coatingModifier = 0;
      let cutModifier = 0;
      
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
      
      if (item.cutType && item.cutOptions) {
        const selectedCut = item.cutOptions.find((opt: any) => opt.name === item.cutType);
        if (selectedCut?.priceModifier) {
          cutModifier = parseFloat(selectedCut.priceModifier) || 0;
        }
      }
      
      const totalPricePerUnit = basePrice + materialModifier + coatingModifier + cutModifier;
      return sum + (totalPricePerUnit * item.quantity);
    }, 0);

    // Shipping is free for now (can be configured later)
    const shipping = 0;
    
    // Total
    const total = subtotal + shipping;

    // Return response with explicit Set-Cookie header
    const response = NextResponse.json({ items, subtotal, shipping, total });
    response.cookies.set({
      name: 'cart-session-id',
      value: sessionId,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 days
    });
    return noCache(response);
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

    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart-session-id')?.value;
    
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    
    console.log('[Cart POST] Session ID:', sessionId || 'NONE', '| User ID:', userId || 'GUEST');

    if (!sessionId) {
      sessionId = randomUUID();
      console.log('[Cart POST] Generated new session ID:', sessionId);
      cookieStore.set({
        name: 'cart-session-id',
        value: sessionId,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      });
    }

    const cart = await getOrCreateCart(sessionId, userId);

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

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  buildOrderConfirmationEmailHtml,
  defaultReceiptSettings,
  ReceiptSettings,
} from '@/lib/email/sendOrderConfirmationEmail';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  let incoming: Partial<ReceiptSettings> = {};
  try {
    incoming = (await req.json()) as Partial<ReceiptSettings>;
  } catch {
    incoming = {};
  }

  const settings: ReceiptSettings = {
    ...defaultReceiptSettings,
    ...incoming,
    // Normalize logoUrl so we don't end up with the string "null"
    logoUrl:
      typeof (incoming as any)?.logoUrl === 'string'
        ? (incoming as any).logoUrl
        : defaultReceiptSettings.logoUrl,
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const html = buildOrderConfirmationEmailHtml({
    orderNumber: 'SB-12345678',
    items: [
      { name: 'TEST PRODUCT', quantity: 1, unitPrice: 9.99 },
      { name: 'ANOTHER ITEM', quantity: 2, unitPrice: 4.5 },
    ],
    totals: {
      subtotal: 18.99,
      shipping: 0,
      tax: 0,
      total: 18.99,
    },
    shippingAddress: {
      name: 'John Doe',
      address1: '123 Main St',
      address2: 'Apt 4B',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85009',
      country: 'US',
    },
    settings,
    siteUrl,
  });

  const res = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });

  return res;
}

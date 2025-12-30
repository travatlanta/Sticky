export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@shared/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const allDeals = await db.select().from(deals);
    return NextResponse.json(allDeals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ message: 'Failed to fetch deals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    const [deal] = await db
      .insert(deals)
      .values({
        title: body.title,
        description: body.description,
        originalPrice: body.originalPrice,
        dealPrice: body.dealPrice,
        imageUrl: body.imageUrl,
        quantity: body.quantity,
        productSize: body.productSize,
        productType: body.productType,
        linkUrl: body.linkUrl,
        badgeText: body.badgeText,
        badgeColor: body.badgeColor || 'yellow',
        ctaText: body.ctaText || 'Shop Now',
        displayOrder: body.displayOrder || 0,
        isActive: body.isActive ?? true,
        showOnHomepage: body.showOnHomepage ?? false,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      })
      .returning();

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ message: 'Failed to create deal' }, { status: 500 });
  }
}

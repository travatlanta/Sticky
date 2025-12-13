import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const [deal] = await db
      .update(deals)
      .set({
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
        badgeColor: body.badgeColor,
        ctaText: body.ctaText,
        displayOrder: body.displayOrder,
        isActive: body.isActive,
        showOnHomepage: body.showOnHomepage,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, parseInt(id)))
      .returning();

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ message: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    await db.delete(deals).where(eq(deals.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ message: 'Failed to delete deal' }, { status: 500 });
  }
}

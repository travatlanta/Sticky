import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    
    const userId = session.user.id;

    const userDesigns = await db
      .select()
      .from(designs)
      .where(eq(designs.userId, userId))
      .orderBy(desc(designs.updatedAt));

    return NextResponse.json(userDesigns);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ message: 'Failed to fetch designs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Get userId from NextAuth session when fully integrated
    // For now, userId should be provided in body
    if (!body.userId) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const [design] = await db
      .insert(designs)
      .values({
        userId: body.userId,
        productId: body.productId || null,
        name: body.name || null,
        canvasJson: body.canvasJson || null,
        previewUrl: body.previewUrl || null,
        customShapeUrl: body.customShapeUrl || null,
        highResExportUrl: body.highResExportUrl || null,
        status: body.status || 'draft',
        selectedOptions: body.selectedOptions || null,
      })
      .returning();

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error creating design:', error);
    return NextResponse.json({ message: 'Failed to create design' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [design] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, parseInt(id)));

    if (!design) {
      return NextResponse.json({ message: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error fetching design:', error);
    return NextResponse.json({ message: 'Failed to fetch design' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // TODO: Verify user owns this design when NextAuth is integrated

    const [design] = await db
      .update(designs)
      .set({
        name: body.name,
        canvasJson: body.canvasJson,
        previewUrl: body.previewUrl,
        customShapeUrl: body.customShapeUrl,
        highResExportUrl: body.highResExportUrl,
        status: body.status,
        selectedOptions: body.selectedOptions,
        lastAutoSave: body.lastAutoSave,
        updatedAt: new Date(),
      })
      .where(eq(designs.id, parseInt(id)))
      .returning();

    if (!design) {
      return NextResponse.json({ message: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating design:', error);
    return NextResponse.json({ message: 'Failed to update design' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const designId = parseInt(id);

    const [existingDesign] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, designId));

    if (!existingDesign) {
      return NextResponse.json({ message: 'Design not found' }, { status: 404 });
    }

    if (existingDesign.userId !== session.user.id) {
      return NextResponse.json({ message: 'You can only delete your own designs' }, { status: 403 });
    }

    await db.delete(designs).where(eq(designs.id, designId));

    return NextResponse.json({ success: true, message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ message: 'Failed to delete design' }, { status: 500 });
  }
}

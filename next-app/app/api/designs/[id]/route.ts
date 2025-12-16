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

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.canvasJson !== undefined) updateData.canvasJson = body.canvasJson;
    if (body.previewUrl !== undefined) updateData.previewUrl = body.previewUrl;
    if (body.customShapeUrl !== undefined) updateData.customShapeUrl = body.customShapeUrl;
    if (body.highResExportUrl !== undefined) updateData.highResExportUrl = body.highResExportUrl;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.selectedOptions !== undefined) updateData.selectedOptions = body.selectedOptions;
    if (body.bleedColor !== undefined) updateData.bleedColor = body.bleedColor;
    if (body.contourPath !== undefined) updateData.contourPath = body.contourPath;
    if (body.lastAutoSave !== undefined) updateData.lastAutoSave = body.lastAutoSave;

    const [design] = await db
      .update(designs)
      .set(updateData)
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update object with only provided fields
    const patchData: Record<string, any> = { updatedAt: new Date() };
    if (body.name !== undefined) patchData.name = body.name;
    if (body.canvasJson !== undefined) patchData.canvasJson = body.canvasJson;
    if (body.previewUrl !== undefined) patchData.previewUrl = body.previewUrl;
    if (body.customShapeUrl !== undefined) patchData.customShapeUrl = body.customShapeUrl;
    if (body.highResExportUrl !== undefined) patchData.highResExportUrl = body.highResExportUrl;
    if (body.status !== undefined) patchData.status = body.status;
    if (body.selectedOptions !== undefined) patchData.selectedOptions = body.selectedOptions;
    if (body.bleedColor !== undefined) patchData.bleedColor = body.bleedColor;
    if (body.contourPath !== undefined) patchData.contourPath = body.contourPath;

    const [design] = await db
      .update(designs)
      .set(patchData)
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

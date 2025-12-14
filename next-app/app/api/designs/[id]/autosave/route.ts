export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [design] = await db
      .update(designs)
      .set({
        canvasJson: body.canvasJson,
        lastAutoSave: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(designs.id, parseInt(id)))
      .returning();

    if (!design) {
      return NextResponse.json({ message: 'Design not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, design });
  } catch (error) {
    console.error('Error autosaving design:', error);
    return NextResponse.json({ message: 'Failed to autosave design' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productTemplates } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const templates = await db
      .select()
      .from(productTemplates)
      .where(eq(productTemplates.productId, parseInt(id)));

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ message: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(
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

    const [template] = await db
      .insert(productTemplates)
      .values({
        productId: parseInt(id),
        name: body.name,
        description: body.description,
        previewImageUrl: body.previewImageUrl || body.previewUrl,
        canvasJson: body.canvasJson,
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ message: 'Failed to create template' }, { status: 500 });
  }
}

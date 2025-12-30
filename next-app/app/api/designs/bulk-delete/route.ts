export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const isAdmin = (session?.user as any)?.isAdmin;

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { designIds } = body;

    if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
      return NextResponse.json({ message: 'No design IDs provided' }, { status: 400 });
    }

    const ids = designIds.map((id: any) => parseInt(id)).filter((id: number) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json({ message: 'No valid design IDs provided' }, { status: 400 });
    }

    let deletedCount = 0;

    if (isAdmin) {
      const result = await db.delete(designs).where(inArray(designs.id, ids));
      deletedCount = ids.length;
    } else {
      const result = await db.delete(designs).where(
        and(
          inArray(designs.id, ids),
          eq(designs.userId, userId)
        )
      );
      deletedCount = ids.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} design(s)`,
      deletedCount 
    });
  } catch (error) {
    console.error('Error bulk deleting designs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      message: 'Failed to delete designs',
      error: errorMessage 
    }, { status: 500 });
  }
}

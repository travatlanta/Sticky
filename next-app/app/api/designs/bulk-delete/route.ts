export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { designs } from '@shared/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BATCH_SIZE = 50; // Process in batches to avoid timeouts

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

    console.log(`Bulk deleting ${ids.length} designs for user ${userId} (isAdmin: ${isAdmin})`);

    let totalDeleted = 0;

    // Process in batches to avoid database timeouts
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      
      try {
        let result: any[];

        if (isAdmin) {
          result = await db.delete(designs).where(inArray(designs.id, batch)).returning({ id: designs.id });
        } else {
          result = await db.delete(designs).where(
            and(
              inArray(designs.id, batch),
              eq(designs.userId, userId)
            )
          ).returning({ id: designs.id });
        }

        totalDeleted += result.length;
        console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: deleted ${result.length} designs`);
      } catch (batchError) {
        console.error(`Error in batch starting at index ${i}:`, batchError);
        // Continue with next batch even if one fails
      }
    }

    if (totalDeleted === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No designs were deleted. They may not exist or you may not have permission.',
        deletedCount: 0 
      }, { status: 404 });
    }

    if (totalDeleted < ids.length) {
      return NextResponse.json({ 
        success: true, 
        message: `Partially deleted: ${totalDeleted} of ${ids.length} design(s). Some may not exist or you may not have permission.`,
        deletedCount: totalDeleted,
        requestedCount: ids.length
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${totalDeleted} design(s)`,
      deletedCount: totalDeleted 
    });
  } catch (error) {
    console.error('Error bulk deleting designs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Stack trace:', errorStack);
    return NextResponse.json({ 
      message: 'Failed to delete designs',
      error: errorMessage 
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@shared/schema';
import { eq, and, or, isNull, gte, lte } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date();

    const result = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          eq(deals.showOnHomepage, true),
          or(isNull(deals.startsAt), lte(deals.startsAt, now)),
          or(isNull(deals.endsAt), gte(deals.endsAt, now))
        )
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching homepage deals:', error);
    return NextResponse.json([], { status: 200 });
  }
}

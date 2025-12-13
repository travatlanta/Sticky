export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { deals } from '@shared/schema';
import { eq, and, or, isNull, gte, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const homepage = searchParams.get('homepage');
    const now = new Date();

    let conditions = [eq(deals.isActive, true)];

    if (homepage === 'true') {
      conditions.push(eq(deals.showOnHomepage, true));
    }

    const result = await db
      .select()
      .from(deals)
      .where(
        and(
          ...conditions,
          or(isNull(deals.startsAt), lte(deals.startsAt, now)),
          or(isNull(deals.endsAt), gte(deals.endsAt, now))
        )
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ message: 'Failed to fetch deals' }, { status: 500 });
  }
}

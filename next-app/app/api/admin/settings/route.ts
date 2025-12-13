import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const settings = await db.select().from(siteSettings);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ message: 'Setting key is required' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key));

    let setting;
    if (existing) {
      [setting] = await db
        .update(siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
    } else {
      [setting] = await db
        .insert(siteSettings)
        .values({ key, value })
        .returning();
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ message: 'Failed to update setting' }, { status: 500 });
  }
}

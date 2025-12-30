import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { siteSettings, users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { defaultHomepageSettings, homepageSettingsSchema, HomepageSettings } from '@/lib/homepage-settings';

const HOMEPAGE_SETTINGS_KEY = 'homepage_content';

async function isAdmin(session: any): Promise<boolean> {
  if (!session?.user?.id) return false;
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  return user?.isAdmin === true;
}

export async function GET() {
  try {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, HOMEPAGE_SETTINGS_KEY));
    
    if (setting?.value) {
      const merged = { ...defaultHomepageSettings, ...(setting.value as object) };
      return NextResponse.json(merged);
    }
    
    return NextResponse.json(defaultHomepageSettings);
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return NextResponse.json(defaultHomepageSettings);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = homepageSettingsSchema.safeParse(body);
    
    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid settings format', details: validated.error }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, HOMEPAGE_SETTINGS_KEY));

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value: validated.data, updatedAt: new Date() })
        .where(eq(siteSettings.key, HOMEPAGE_SETTINGS_KEY));
    } else {
      await db.insert(siteSettings).values({
        key: HOMEPAGE_SETTINGS_KEY,
        value: validated.data,
      });
    }

    return NextResponse.json({ success: true, settings: validated.data });
  } catch (error) {
    console.error('Error saving homepage settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.delete(siteSettings).where(eq(siteSettings.key, HOMEPAGE_SETTINGS_KEY));
    
    return NextResponse.json({ success: true, settings: defaultHomepageSettings });
  } catch (error) {
    console.error('Error resetting homepage settings:', error);
    return NextResponse.json({ error: 'Failed to reset settings' }, { status: 500 });
  }
}

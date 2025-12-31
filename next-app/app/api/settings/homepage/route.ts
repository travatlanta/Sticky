import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { defaultHomepageSettings } from '@/lib/homepage-settings';

const HOMEPAGE_SETTINGS_KEY = 'homepage_content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, HOMEPAGE_SETTINGS_KEY));
    
    if (setting?.value) {
      const merged = { ...defaultHomepageSettings, ...(setting.value as object) };
      return NextResponse.json(merged, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    return NextResponse.json(defaultHomepageSettings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return NextResponse.json(defaultHomepageSettings);
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { defaultThemeSettings } from '@/lib/homepage-settings';

export async function GET() {
  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'theme_colors'))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      return NextResponse.json(result[0].value);
    }

    return NextResponse.json(defaultThemeSettings);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    return NextResponse.json(defaultThemeSettings);
  }
}

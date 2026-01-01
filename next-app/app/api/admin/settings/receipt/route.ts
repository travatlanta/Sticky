export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const RECEIPT_SETTINGS_KEY = 'receipt_template';

const receiptSettingsSchema = z.object({
  headerColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format (use #RRGGBB)'),
  logoUrl: z.string().url().or(z.literal('')).optional().default(''),
  companyName: z.string().min(1, 'Company name is required'),
  supportEmail: z.string().email('Invalid email format'),
  companyAddress: z.string().min(1, 'Company address is required'),
  companyPhone: z.string().min(1, 'Phone number is required'),
  footerMessage: z.string().min(1, 'Footer message is required'),
  thankYouMessage: z.string().min(1, 'Thank you message is required'),
});

export type ReceiptSettings = z.infer<typeof receiptSettingsSchema>;

const defaultSettings: ReceiptSettings = {
  headerColor: '#1a1a1a',
  logoUrl: '',
  companyName: 'Sticky Banditos Printing Company',
  supportEmail: 'mhobbs.stickybanditos@gmail.com',
  companyAddress: '2 North 35th Ave, Phoenix, AZ 85009',
  companyPhone: '602-554-5338',
  footerMessage: 'Questions about your order? Contact us at',
  thankYouMessage: 'Thank you for your order!',
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, RECEIPT_SETTINGS_KEY));

    if (!setting || !setting.value) {
      return NextResponse.json(defaultSettings);
    }

    const storedValue = setting.value as Record<string, unknown>;
    const merged: ReceiptSettings = {
      headerColor: typeof storedValue.headerColor === 'string' ? storedValue.headerColor : defaultSettings.headerColor,
      logoUrl: typeof storedValue.logoUrl === 'string' ? storedValue.logoUrl : defaultSettings.logoUrl,
      companyName: typeof storedValue.companyName === 'string' ? storedValue.companyName : defaultSettings.companyName,
      supportEmail: typeof storedValue.supportEmail === 'string' ? storedValue.supportEmail : defaultSettings.supportEmail,
      companyAddress: typeof storedValue.companyAddress === 'string' ? storedValue.companyAddress : defaultSettings.companyAddress,
      companyPhone: typeof storedValue.companyPhone === 'string' ? storedValue.companyPhone : defaultSettings.companyPhone,
      footerMessage: typeof storedValue.footerMessage === 'string' ? storedValue.footerMessage : defaultSettings.footerMessage,
      thankYouMessage: typeof storedValue.thankYouMessage === 'string' ? storedValue.thankYouMessage : defaultSettings.thankYouMessage,
    };
    
    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching receipt settings:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    
    if (!(session.user as any).isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    const parseResult = receiptSettingsSchema.safeParse(body);
    
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ message: `Validation failed: ${errors}` }, { status: 400 });
    }
    
    const settings = parseResult.data;

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, RECEIPT_SETTINGS_KEY));

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value: settings, updatedAt: new Date() })
        .where(eq(siteSettings.key, RECEIPT_SETTINGS_KEY));
    } else {
      await db.insert(siteSettings).values({
        key: RECEIPT_SETTINGS_KEY,
        value: settings,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating receipt settings:', error);
    return NextResponse.json({ message: 'Failed to update settings' }, { status: 500 });
  }
}

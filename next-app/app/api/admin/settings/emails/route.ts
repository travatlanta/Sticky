export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { 
  emailTypes, 
  defaultTemplates, 
  emailTypeLabels,
  type EmailType,
  type EmailTemplate,
  type EmailTemplates,
} from '@/lib/email/emailTemplateTypes';

const EMAIL_TEMPLATES_KEY = 'email_templates';

const emailTemplateSchema = z.object({
  subject: z.string().min(1),
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  greeting: z.string().optional(),
  bodyMessage: z.string().min(1),
  ctaButtonText: z.string().min(1),
  ctaButtonColor: z.enum(['orange', 'green', 'blue', 'purple', 'red']),
  footerMessage: z.string().optional(),
  thankYouMessage: z.string().optional(),
  logoUrl: z.string().optional(),
});

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
      .where(eq(siteSettings.key, EMAIL_TEMPLATES_KEY));

    const storedTemplates = (setting?.value as EmailTemplates) || {};
    
    const mergedTemplates: Record<EmailType, EmailTemplate> = { ...defaultTemplates };
    for (const type of emailTypes) {
      if (storedTemplates[type]) {
        mergedTemplates[type] = { ...defaultTemplates[type], ...storedTemplates[type] };
      }
    }

    return NextResponse.json({
      templates: mergedTemplates,
      emailTypes,
      emailTypeLabels,
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json({ message: 'Failed to fetch templates' }, { status: 500 });
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
    const { emailType, template } = body;

    if (!emailTypes.includes(emailType)) {
      return NextResponse.json({ message: 'Invalid email type' }, { status: 400 });
    }

    const parseResult = emailTemplateSchema.safeParse(template);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ message: `Validation failed: ${errors}` }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, EMAIL_TEMPLATES_KEY));

    const currentTemplates = (existing?.value as EmailTemplates) || {};
    const updatedTemplates: EmailTemplates = {
      ...currentTemplates,
      [emailType]: parseResult.data,
    };

    if (existing) {
      await db
        .update(siteSettings)
        .set({ value: updatedTemplates, updatedAt: new Date() })
        .where(eq(siteSettings.key, EMAIL_TEMPLATES_KEY));
    } else {
      await db.insert(siteSettings).values({
        key: EMAIL_TEMPLATES_KEY,
        value: updatedTemplates,
      });
    }

    return NextResponse.json({ success: true, template: parseResult.data });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json({ message: 'Failed to update template' }, { status: 500 });
  }
}

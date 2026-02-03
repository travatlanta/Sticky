import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  defaultTemplates, 
  type EmailType, 
  type EmailTemplate 
} from './emailTemplateTypes';

export type { EmailType, EmailTemplate };
export { defaultTemplates };

const EMAIL_TEMPLATES_KEY = 'email_templates';

let cachedTemplates: Record<EmailType, EmailTemplate> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getEmailTemplate(type: EmailType): Promise<EmailTemplate> {
  const now = Date.now();
  
  if (cachedTemplates && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedTemplates[type] || defaultTemplates[type];
  }

  try {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, EMAIL_TEMPLATES_KEY));

    const storedTemplates = (setting?.value as Partial<Record<EmailType, EmailTemplate>>) || {};
    
    const mergedTemplates: Record<EmailType, EmailTemplate> = { ...defaultTemplates };
    for (const key of Object.keys(defaultTemplates) as EmailType[]) {
      if (storedTemplates[key]) {
        mergedTemplates[key] = { ...defaultTemplates[key], ...storedTemplates[key] };
      }
    }

    cachedTemplates = mergedTemplates;
    cacheTimestamp = now;

    return mergedTemplates[type];
  } catch (error) {
    console.error('Error loading email template:', error);
    return defaultTemplates[type];
  }
}

export async function isEmailEnabled(type: EmailType): Promise<boolean> {
  const template = await getEmailTemplate(type);
  return template.enabled !== false;
}

export function replaceTemplateVariables(
  text: string, 
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

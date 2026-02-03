import { db } from '@/lib/db';
import { siteSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const EMAIL_TEMPLATES_KEY = 'email_templates';

export type EmailType = 
  | 'order_confirmation'
  | 'artwork_approval'
  | 'ready_for_pickup'
  | 'admin_new_order'
  | 'admin_design_submitted'
  | 'admin_artwork_approved'
  | 'admin_issue_flagged'
  | 'admin_order_paid';

export interface EmailTemplate {
  subject: string;
  headline: string;
  subheadline?: string;
  greeting?: string;
  bodyMessage: string;
  ctaButtonText: string;
  ctaButtonColor: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  footerMessage?: string;
  thankYouMessage?: string;
}

export const defaultTemplates: Record<EmailType, EmailTemplate> = {
  order_confirmation: {
    subject: 'Order Confirmation - {orderNumber} | Sticky Banditos',
    headline: 'Order Confirmation',
    subheadline: 'Your order has been received',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Thank you for your order! We\'ve received your order and will begin processing it shortly.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'orange',
    footerMessage: 'Questions about your order? Contact us at',
    thankYouMessage: 'Thank you for your order!',
  },
  artwork_approval: {
    subject: 'Action Required: Approve Your Design - Order #{orderNumber} | Sticky Banditos',
    headline: 'Your Design is Ready for Review',
    subheadline: 'One quick approval and we start printing!',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Your custom design has been prepared and is ready for your approval. Take a look and let us know if it\'s good to print!',
    ctaButtonText: 'Review & Approve Design',
    ctaButtonColor: 'green',
    footerMessage: 'If you have any questions about your design, feel free to reply through your account messages.',
  },
  ready_for_pickup: {
    subject: 'Order {orderNumber} - Ready for Pickup! | Sticky Banditos',
    headline: 'Your Order is Ready for Pickup!',
    subheadline: 'Come pick up your order',
    greeting: 'Hi {customerName},',
    bodyMessage: 'Great news! Your order is ready and waiting for you.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'orange',
    footerMessage: 'Please bring a valid ID when picking up your order.',
  },
  admin_new_order: {
    subject: 'New Order #{orderNumber} Received',
    headline: 'New Order Received!',
    bodyMessage: 'A new order has been placed by {customerName}.',
    ctaButtonText: 'View Order Details',
    ctaButtonColor: 'green',
  },
  admin_design_submitted: {
    subject: 'Design Submitted - Order #{orderNumber}',
    headline: 'Design Submitted for Review',
    bodyMessage: '{customerName} has submitted their design for approval on order #{orderNumber}.',
    ctaButtonText: 'Review Design',
    ctaButtonColor: 'purple',
  },
  admin_artwork_approved: {
    subject: 'Artwork Approved - Order #{orderNumber}',
    headline: 'Customer Approved Artwork!',
    bodyMessage: '{customerName} has approved the artwork for order #{orderNumber}. It\'s ready for production!',
    ctaButtonText: 'Start Production',
    ctaButtonColor: 'green',
  },
  admin_issue_flagged: {
    subject: 'Issue Flagged - Order #{orderNumber}',
    headline: 'Printing Issue Flagged',
    bodyMessage: 'An issue has been flagged on order #{orderNumber}. The customer has been notified to review and approve the changes.',
    ctaButtonText: 'View Order',
    ctaButtonColor: 'orange',
  },
  admin_order_paid: {
    subject: 'Payment Received - Order #{orderNumber}',
    headline: 'Payment Received!',
    bodyMessage: '{customerName} has successfully paid for order #{orderNumber}. The order is now ready for production!',
    ctaButtonText: 'View Order',
    ctaButtonColor: 'green',
  },
};

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

export function replaceTemplateVariables(
  text: string, 
  variables: Record<string, string>
): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  result = result.replace(new RegExp(`#\\{`, 'g'), '#');
  return result;
}

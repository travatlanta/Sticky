import { db } from '@/lib/db';
import { emailDeliveries, siteSettings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';
import { renderOrderConfirmationEmailHtml } from './orderConfirmationEmailHtml';

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface ShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface SendEmailParams {
  toEmail: string;
  orderNumber: string;
  items: OrderItem[];
  totals: OrderTotals;
  shippingAddress: ShippingAddress;

  /**
   * Optional: used to log delivery status in the email_deliveries table.
   * If not provided, the email still sends, but no delivery record is written.
   */
  orderId?: number;

  /**
   * Delivery type for idempotency.
   * Default: 'order_confirmation'
   */
  deliveryType?: string;

  /**
   * If true, send even if this delivery type has already been marked as sent.
   * Intended for admin resends.
   */
  forceSend?: boolean;
}

interface ReceiptSettings {
  headerColor: string;
  logoUrl: string;
  companyName: string;
  supportEmail: string;
  companyAddress: string;
  companyPhone: string;
  footerMessage: string;
  thankYouMessage: string;
}

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

type EmailDeliveryRow = typeof emailDeliveries.$inferSelect;

async function getReceiptSettings(): Promise<ReceiptSettings> {
  try {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'receipt_template'));

    if (!setting || !setting.value) {
      return defaultSettings;
    }

    const storedValue = setting.value as Record<string, unknown>;
    return {
      headerColor:
        typeof storedValue.headerColor === 'string' && storedValue.headerColor
          ? storedValue.headerColor
          : defaultSettings.headerColor,
      logoUrl: typeof storedValue.logoUrl === 'string' ? storedValue.logoUrl : defaultSettings.logoUrl,
      companyName:
        typeof storedValue.companyName === 'string' && storedValue.companyName
          ? storedValue.companyName
          : defaultSettings.companyName,
      supportEmail:
        typeof storedValue.supportEmail === 'string' && storedValue.supportEmail
          ? storedValue.supportEmail
          : defaultSettings.supportEmail,
      companyAddress:
        typeof storedValue.companyAddress === 'string' && storedValue.companyAddress
          ? storedValue.companyAddress
          : defaultSettings.companyAddress,
      companyPhone:
        typeof storedValue.companyPhone === 'string' && storedValue.companyPhone
          ? storedValue.companyPhone
          : defaultSettings.companyPhone,
      footerMessage:
        typeof storedValue.footerMessage === 'string' && storedValue.footerMessage
          ? storedValue.footerMessage
          : defaultSettings.footerMessage,
      thankYouMessage:
        typeof storedValue.thankYouMessage === 'string' && storedValue.thankYouMessage
          ? storedValue.thankYouMessage
          : defaultSettings.thankYouMessage,
    };
  } catch (error) {
    console.error('Error fetching receipt settings:', error);
    return defaultSettings;
  }
}

async function getEmailDelivery(orderId: number, type: string): Promise<EmailDeliveryRow | null> {
  const [row] = await db
    .select()
    .from(emailDeliveries)
    .where(and(eq(emailDeliveries.orderId, orderId), eq(emailDeliveries.type, type)));

  return row ?? null;
}

async function upsertDeliveryPending({
  orderId,
  type,
  toEmail,
  existing,
}: {
  orderId: number;
  type: string;
  toEmail: string;
  existing: EmailDeliveryRow | null;
}) {
  const now = new Date();

  if (!existing) {
    await db.insert(emailDeliveries).values({
      orderId,
      type,
      toEmail,
      status: 'pending',
      attempts: 1,
      lastAttemptAt: now,
      updatedAt: now,
      createdAt: now,
    });
    return;
  }

  const nextAttempts = (existing.attempts ?? 0) + 1;

  await db
    .update(emailDeliveries)
    .set({
      toEmail,
      status: 'pending',
      attempts: nextAttempts,
      lastAttemptAt: now,
      lastError: null,
      updatedAt: now,
    })
    .where(eq(emailDeliveries.id, existing.id));
}

async function markDeliverySent({
  deliveryId,
  resendId,
}: {
  deliveryId: number;
  resendId?: string | null;
}) {
  const now = new Date();

  await db
    .update(emailDeliveries)
    .set({
      status: 'sent',
      sentAt: now,
      resendId: resendId ?? null,
      lastError: null,
      updatedAt: now,
    })
    .where(eq(emailDeliveries.id, deliveryId));
}

async function markDeliveryFailed({
  deliveryId,
  errorMessage,
}: {
  deliveryId: number;
  errorMessage: string;
}) {
  const now = new Date();

  await db
    .update(emailDeliveries)
    .set({
      status: 'failed',
      lastError: errorMessage,
      updatedAt: now,
    })
    .where(eq(emailDeliveries.id, deliveryId));
}

export async function sendOrderConfirmationEmail({
  toEmail,
  orderNumber,
  items,
  totals,
  shippingAddress,
  orderId,
  deliveryType,
  forceSend,
}: SendEmailParams): Promise<{ ok: boolean; skipped?: boolean; error?: string; resendId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ORDER_EMAIL_FROM || 'Sticky Banditos <donotreply@stickybanditos.com>';
  const siteUrl = process.env.SITE_URL || 'https://stickybanditos.com';

  const type = (deliveryType && deliveryType.trim()) || 'order_confirmation';
  const shouldForceSend = Boolean(forceSend);

  let existingDelivery: EmailDeliveryRow | null = null;
  let deliveryLoggingAvailable = true;

  if (typeof orderId === 'number' && Number.isFinite(orderId)) {
    try {
      existingDelivery = await getEmailDelivery(orderId, type);

      if (existingDelivery && existingDelivery.status === 'sent' && !shouldForceSend) {
        return { ok: true, skipped: true };
      }

      // Mark this attempt as pending (increments attempts)
      await upsertDeliveryPending({
        orderId,
        type,
        toEmail,
        existing: existingDelivery,
      });

      // Refresh row so we have the inserted/updated id for later updates
      existingDelivery = await getEmailDelivery(orderId, type);
    } catch (e) {
      // Logging must never block sending the email.
      deliveryLoggingAvailable = false;
      existingDelivery = null;
      console.error('Email delivery logging unavailable (continuing without logging):', e);
    }
  }

  if (!apiKey) {
    const msg = 'RESEND_API_KEY is not configured';
    console.error(msg);

    if (deliveryLoggingAvailable && existingDelivery) {
      try {
        await markDeliveryFailed({ deliveryId: existingDelivery.id, errorMessage: msg });
      } catch (e) {
        console.error('Failed to mark email delivery failed:', e);
      }
    }

    return { ok: false, error: 'Email service not configured' };
  }

  const settings = await getReceiptSettings();
  const htmlBody = renderOrderConfirmationEmailHtml({
    siteUrl,
    orderNumber,
    shippingAddress,
    items,
    totals,
    receiptSettings: settings,
  });


  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Order Confirmation – ${orderNumber}`,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = `Resend API error: ${response.status}`;
      console.error(msg, errorData);

      if (deliveryLoggingAvailable && existingDelivery) {
        try {
          await markDeliveryFailed({
            deliveryId: existingDelivery.id,
            errorMessage: `${msg} ${JSON.stringify(errorData)}`.slice(0, 5000),
          });
        } catch (e) {
          console.error('Failed to mark email delivery failed:', e);
        }
      }

      return { ok: false, error: `Email API error: ${response.status}` };
    }

    const result = (await response.json().catch(() => ({}))) as { id?: string };
    console.log('Order confirmation email sent successfully:', result?.id);

    if (deliveryLoggingAvailable && existingDelivery) {
      try {
        await markDeliverySent({
          deliveryId: existingDelivery.id,
          resendId: typeof result?.id === 'string' ? result.id : null,
        });
      } catch (e) {
        console.error('Failed to mark email delivery sent:', e);
      }
    }

    return { ok: true, resendId: typeof result?.id === 'string' ? result.id : undefined };
  } catch (error) {
    const msg = `Failed to send order confirmation email: ${String(error)}`;
    console.error(msg);

    if (deliveryLoggingAvailable && existingDelivery) {
      try {
        await markDeliveryFailed({ deliveryId: existingDelivery.id, errorMessage: msg.slice(0, 5000) });
      } catch (e) {
        console.error('Failed to mark email delivery failed:', e);
      }
    }

    return { ok: false, error: String(error) };
  }
}
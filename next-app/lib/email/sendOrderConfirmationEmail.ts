import { db } from '@/lib/db';
import { emailDeliveries, siteSettings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

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
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
          ${item.name}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; font-family: Arial, sans-serif;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-family: Arial, sans-serif;">
          ${formatCurrency(item.unitPrice)}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-family: Arial, sans-serif;">
          ${formatCurrency(item.unitPrice * item.quantity)}
        </td>
      </tr>
    `
    )
    .join('');

  const addressHtml = `
    ${shippingAddress.name}<br>
    ${shippingAddress.address1}<br>
    ${shippingAddress.address2 ? `${shippingAddress.address2}<br>` : ''}
    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
    ${shippingAddress.country || 'USA'}
  `;

  const logoHtml = settings.logoUrl
    ? `<img src="${settings.logoUrl}" alt="${settings.companyName}" height="60" style="max-height: 60px; height: 60px; display: block; border: 0; outline: none; text-decoration: none;">`
    : `<img src="${siteUrl}/logo.png" alt="${settings.companyName}" height="60" style="max-height: 60px; height: 60px; display: block; border: 0; outline: none; text-decoration: none;">`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <center style="width: 100%; background-color: #f5f5f5;">
    <!-- Preheader (hidden preview text) -->
    <div style="display: none; font-size: 1px; color: #f5f5f5; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
      Order Confirmation – ${orderNumber} – ${settings.companyName}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f5f5"
      style="width: 100%; background-color: #f5f5f5; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <!--[if (gte mso 9)|(IE)]>
          <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
          <![endif]-->

          <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"
            style="width: 600px; max-width: 600px; Margin: 0 auto; background-color: #ffffff; border-collapse: collapse; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<!-- Header -->
          <tr>
            <td bgcolor="${settings.headerColor}" style="background-color: ${settings.headerColor}; padding: 24px; text-align: center;">
              ${logoHtml}
            </td>
          </tr>

          <!-- Order Confirmation Title -->
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">Order Confirmation</h1>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 16px;">${settings.thankYouMessage}</p>
            </td>
          </tr>

          <!-- Order Number -->
          <tr>
            <td style="padding: 0 32px 24px 32px; text-align: center;">
              <div style="background-color: #f8f8f8; border-radius: 8px; padding: 16px; display: inline-block;">
                <span style="color: #666; font-size: 14px;">Order Number</span><br>
                <span style="color: #1a1a1a; font-size: 20px; font-weight: bold;">${orderNumber}</span>
              </div>
            </td>
          </tr>

          <!-- Order Items -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: left; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Product</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: center; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Qty</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: right; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Price</th>
                  <th style="padding: 12px 0; border-bottom: 2px solid #333; text-align: right; font-family: Arial, sans-serif; font-size: 12px; text-transform: uppercase; color: #666;">Total</th>
                </tr>
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Order Totals -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Subtotal</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.subtotal)}</td>
                </tr>
                ${
                  totals.shipping > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Expedited Shipping</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.shipping)}</td>
                </tr>
                `
                    : ''
                }
                ${
                  totals.tax > 0
                    ? `
                <tr>
                  <td style="padding: 8px 0; font-family: Arial, sans-serif; color: #666;">Tax</td>
                  <td style="padding: 8px 0; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(totals.tax)}</td>
                </tr>
                `
                    : ''
                }
                <tr>
                  <td style="padding: 16px 0 8px 0; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">Grand Total</td>
                  <td style="padding: 16px 0 8px 0; text-align: right; font-family: Arial, sans-serif; font-weight: bold; font-size: 18px; border-top: 2px solid #333;">${formatCurrency(totals.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 18px; font-weight: bold; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Shipping Address</h2>
              <p style="margin: 0; color: #333; line-height: 1.6; font-family: Arial, sans-serif;">
                ${addressHtml}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; font-family: Arial, sans-serif;">
                ${settings.footerMessage}<br>
                <a href="mailto:${settings.supportEmail}" style="color: #1a1a1a;">${settings.supportEmail}</a>
              </p>
              <p style="margin: 16px 0 0 0; color: #999; font-size: 12px; font-family: Arial, sans-serif;">
                ${settings.companyName}<br>
                ${settings.companyAddress}<br>
                <a href="tel:${settings.companyPhone.replace(/[^0-9]/g, '')}" style="color: #999;">${settings.companyPhone}</a>
              </p>
            </td>
          </tr>
        
          </table>

          <!--[if (gte mso 9)|(IE)]>
              </td>
            </tr>
          </table>
          <![endif]-->
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;

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

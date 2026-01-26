import { Resend } from 'resend';
import { generateEmailHtml, generatePlainText } from './email/template';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Sticky Banditos <noreply@stickybanditos.com>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://stickybanditos.com';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Email send exception:', error);
    return { success: false, error: error.message };
  }
}

export function generateOrderMessageEmail(params: {
  customerName: string;
  orderId: number;
  message: string;
}): { subject: string; html: string; text: string } {
  const { customerName, orderId, message } = params;
  const messagesUrl = `${BASE_URL}/account/messages?orderId=${orderId}`;

  const subject = `Message About Your Order #${orderId} | Sticky Banditos`;

  const bodyContent = `
    <div style="background: rgba(249, 115, 22, 0.1); border-left: 4px solid #f97316; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
      <p style="margin: 0; color: #e5e7eb; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${message}</p>
    </div>
    <p style="margin: 20px 0 0 0; color: #9ca3af;">
      Click the button below to view this message and reply through your account.
    </p>
  `;

  const html = generateEmailHtml({
    preheaderText: `You have a new message about Order #${orderId}`,
    headline: 'You Have a New Message',
    subheadline: `Regarding your Order #${orderId}`,
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent,
    ctaButton: {
      text: 'View Message & Reply',
      url: messagesUrl,
      color: 'orange',
    },
    customFooterNote: 'Please do not reply directly to this email as it is not monitored. Use the button above to reply through your account.',
  });

  const text = generatePlainText({
    headline: 'You Have a New Message',
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent: `We have a message regarding your order #${orderId}:\n\n${message}`,
    ctaButton: {
      text: 'View Message & Reply',
      url: messagesUrl,
    },
    customFooterNote: 'Please do not reply directly to this email. Use the link above to reply through your account.',
  });

  return { subject, html, text };
}

export function generatePaymentLinkEmail(params: {
  customerName: string;
  orderId: number;
  orderNumber: string;
  total: string;
  paymentUrl: string;
}): { subject: string; html: string; text: string } {
  const { customerName, orderId, orderNumber, total, paymentUrl } = params;

  const subject = `Complete Your Payment - Order #${orderNumber} | Sticky Banditos`;

  const bodyContent = `
    <p style="margin: 0 0 20px 0;">Your order is ready and waiting! Complete your payment to get your custom stickers into production.</p>
    
    <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Total</p>
      <p style="margin: 0; color: #22c55e; font-size: 32px; font-weight: 800;">${total}</p>
      <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Order #${orderNumber}</p>
    </div>
    
    <p style="margin: 0; color: #9ca3af;">
      Click the button below to securely complete your payment. Your order will begin production as soon as we receive payment.
    </p>
  `;

  const html = generateEmailHtml({
    preheaderText: `Complete payment for Order #${orderNumber} - ${total}`,
    headline: 'Complete Your Payment',
    subheadline: 'Your custom stickers are almost ready!',
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent,
    ctaButton: {
      text: 'Pay Now',
      url: paymentUrl,
      color: 'green',
    },
    secondaryButton: {
      text: 'View Order Details',
      url: `${BASE_URL}/orders/${orderId}`,
    },
  });

  const text = generatePlainText({
    headline: 'Complete Your Payment',
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent: `Your order #${orderNumber} is ready! Complete your payment of ${total} to get your custom stickers into production.`,
    ctaButton: {
      text: 'Pay Now',
      url: paymentUrl,
    },
  });

  return { subject, html, text };
}

export function generateOrderShippedEmail(params: {
  customerName: string;
  orderId: number;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}): { subject: string; html: string; text: string } {
  const { customerName, orderId, orderNumber, trackingNumber, trackingUrl, carrier } = params;

  const subject = `Your Order Has Shipped! #${orderNumber} | Sticky Banditos`;

  const bodyContent = `
    <p style="margin: 0 0 20px 0;">Great news! Your custom stickers have shipped and are on their way to you!</p>
    
    ${trackingNumber ? `
    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
            <p style="margin: 0; color: #a78bfa; font-size: 18px; font-weight: 700; font-family: monospace;">${trackingNumber}</p>
            ${carrier ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Carrier: ${carrier}</p>` : ''}
          </td>
        </tr>
      </table>
    </div>
    ` : ''}
    
    <p style="margin: 0; color: #9ca3af;">
      You can track your package using the button below. Typical delivery time is 3-5 business days.
    </p>
  `;

  const html = generateEmailHtml({
    preheaderText: `Order #${orderNumber} has shipped! Track your package.`,
    headline: 'Your Order Has Shipped!',
    subheadline: `Order #${orderNumber} is on its way`,
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent,
    ctaButton: trackingUrl ? {
      text: 'Track Your Package',
      url: trackingUrl,
      color: 'purple',
    } : {
      text: 'View Order',
      url: `${BASE_URL}/orders/${orderId}`,
      color: 'orange',
    },
  });

  const text = generatePlainText({
    headline: 'Your Order Has Shipped!',
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent: `Great news! Your order #${orderNumber} has shipped!${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`,
    ctaButton: trackingUrl ? {
      text: 'Track Package',
      url: trackingUrl,
    } : {
      text: 'View Order',
      url: `${BASE_URL}/orders/${orderId}`,
    },
  });

  return { subject, html, text };
}

export function generateWelcomeEmail(params: {
  customerName: string;
}): { subject: string; html: string; text: string } {
  const { customerName } = params;

  const subject = 'Welcome to Sticky Banditos! 🎉';

  const bodyContent = `
    <p style="margin: 0 0 20px 0;">You've just joined the coolest sticker company in Phoenix! We're stoked to have you.</p>
    
    <div style="margin: 24px 0;">
      <p style="margin: 0 0 12px 0; color: #f97316; font-weight: 700;">What makes us different:</p>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #d1d5db;">
        <li style="margin-bottom: 8px;">Premium vinyl that lasts for years</li>
        <li style="margin-bottom: 8px;">Full-featured online design editor</li>
        <li style="margin-bottom: 8px;">Fast turnaround times</li>
        <li style="margin-bottom: 8px;">Local Phoenix printing shop vibes</li>
      </ul>
    </div>
    
    <p style="margin: 0; color: #9ca3af;">
      Ready to create something awesome? Check out our products and start designing!
    </p>
  `;

  const html = generateEmailHtml({
    preheaderText: 'Welcome to the Sticky Banditos family!',
    headline: 'Welcome to the Family!',
    subheadline: "You're officially a Sticky Bandito",
    greeting: `Hey ${customerName || 'there'},`,
    bodyContent,
    ctaButton: {
      text: 'Start Designing',
      url: `${BASE_URL}/products`,
      color: 'orange',
    },
  });

  const text = generatePlainText({
    headline: 'Welcome to Sticky Banditos!',
    greeting: `Hey ${customerName || 'there'},`,
    bodyContent: "You've just joined the coolest sticker company in Phoenix! We're stoked to have you. Ready to create something awesome?",
    ctaButton: {
      text: 'Start Designing',
      url: `${BASE_URL}/products`,
    },
  });

  return { subject, html, text };
}

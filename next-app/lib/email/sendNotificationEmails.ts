import { generateEmailHtml, generatePlainText } from './template';

// Comma-separated list supported via env. Falls back to the official main admin email.
const ADMIN_EMAILS = (process.env.ADMIN_ORDER_NOTIFICATION_EMAILS ||
  process.env.ADMIN_NOTIFICATION_EMAILS ||
  process.env.ADMIN_EMAIL ||
  'mhobbs.stickybanditos@gmail.com')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const FROM_EMAIL = process.env.ORDER_EMAIL_FROM || 'Sticky Banditos <donotreply@stickybanditos.com>';
const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://stickybanditos.com';

async function sendEmail(to: string | string[], subject: string, html: string, text?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - emails will not be sent');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

interface ArtworkApprovalEmailParams {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderId: number;
  artworkPreviewUrl: string;
  isFlagged?: boolean;
}

export async function sendArtworkApprovalEmail(params: ArtworkApprovalEmailParams): Promise<boolean> {
  const { customerEmail, customerName, orderNumber, orderId, artworkPreviewUrl, isFlagged } = params;
  const orderUrl = `${SITE_URL}/orders/${orderId}`;

  const subject = isFlagged 
    ? `Action Required: Artwork Updated - Order #${orderNumber} | Sticky Banditos`
    : `Action Required: Approve Your Design - Order #${orderNumber} | Sticky Banditos`;

  const headline = isFlagged
    ? "We've Updated Your Artwork"
    : "Your Design is Ready for Review";

  const message = isFlagged
    ? "We noticed an issue with your artwork and made some adjustments to ensure the best print quality. Please review the updated design below."
    : "Your custom design has been prepared and is ready for your approval. Take a look and let us know if it's good to print!";

  const bodyContent = `
    <p style="margin: 0 0 20px 0;">${message}</p>
    
    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
      <p style="margin: 0 0 16px 0; color: #a78bfa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order #${orderNumber}</p>
      ${artworkPreviewUrl ? `
      <div style="background: #0f0f0f; border-radius: 8px; padding: 16px; display: inline-block;">
        <img src="${artworkPreviewUrl}" alt="Your Design Preview" style="max-width: 100%; max-height: 300px; border-radius: 4px;">
      </div>
      ` : ''}
    </div>
    
    <p style="margin: 0; color: #9ca3af;">
      Click the button below to review and approve your design. Once approved, we'll start printing right away!
    </p>
  `;

  const html = generateEmailHtml({
    preheaderText: `Your design for Order #${orderNumber} is ready for approval`,
    headline,
    subheadline: isFlagged ? 'Please review the changes we made' : 'One quick approval and we start printing!',
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent,
    ctaButton: {
      text: 'Review & Approve Design',
      url: orderUrl,
      color: 'green',
    },
    customFooterNote: 'If you have any questions about your design, feel free to reply through your account messages.',
  });

  const text = generatePlainText({
    headline,
    greeting: `Hi ${customerName || 'there'},`,
    bodyContent: `${message}\n\nOrder #${orderNumber}`,
    ctaButton: {
      text: 'Review & Approve Design',
      url: orderUrl,
    },
  });

  const success = await sendEmail(customerEmail, subject, html, text);
  if (success) {
    console.log(`Artwork approval email sent to ${customerEmail} for order ${orderNumber}`);
  }
  return success;
}

interface AdminNotificationParams {
  type: 'new_order' | 'design_submitted' | 'artwork_approved' | 'issue_flagged' | 'order_paid';
  orderNumber: string;
  orderId: number;
  customerName?: string;
  customerEmail?: string;
  artworkPreviewUrl?: string;
  paymentAmount?: string;
}

export async function sendAdminNotificationEmail(params: AdminNotificationParams): Promise<boolean> {
  const { type, orderNumber, orderId, customerName, customerEmail, artworkPreviewUrl, paymentAmount } = params;
  const orderUrl = `${SITE_URL}/admin/orders?id=${orderId}`;

  let subject: string;
  let headline: string;
  let message: string;
  let actionLabel: string;
  let color: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  let badgeEmoji: string;

  switch (type) {
    case 'new_order':
      subject = `💰 New Order #${orderNumber} Received`;
      headline = 'New Order Received!';
      message = `A new order has been placed by ${customerName || 'a customer'}${customerEmail ? ` (${customerEmail})` : ''}.`;
      actionLabel = 'View Order Details';
      color = 'green';
      badgeEmoji = '💰';
      break;
    case 'design_submitted':
      subject = `🎨 Design Submitted - Order #${orderNumber}`;
      headline = 'Design Submitted for Review';
      message = `${customerName || 'A customer'} has submitted their design for approval on order #${orderNumber}.`;
      actionLabel = 'Review Design';
      color = 'purple';
      badgeEmoji = '🎨';
      break;
    case 'artwork_approved':
      subject = `✅ Artwork Approved - Order #${orderNumber}`;
      headline = 'Customer Approved Artwork!';
      message = `${customerName || 'The customer'} has approved the artwork for order #${orderNumber}. It's ready for production!`;
      actionLabel = 'Start Production';
      color = 'green';
      badgeEmoji = '✅';
      break;
    case 'issue_flagged':
      subject = `⚠️ Issue Flagged - Order #${orderNumber}`;
      headline = 'Printing Issue Flagged';
      message = `An issue has been flagged on order #${orderNumber}. The customer has been notified to review and approve the changes.`;
      actionLabel = 'View Order';
      color = 'orange';
      badgeEmoji = '⚠️';
      break;
    case 'order_paid':
      subject = `💳 Payment Received - Order #${orderNumber}`;
      headline = 'Payment Received!';
      message = `${customerName || 'A customer'} has successfully paid${paymentAmount ? ` $${paymentAmount}` : ''} for order #${orderNumber}. The order is now ready for production!`;
      actionLabel = 'View Order';
      color = 'green';
      badgeEmoji = '💳';
      break;
    default:
      return false;
  }

  const bodyContent = `
    <p style="margin: 0 0 20px 0;">${message}</p>
    
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; color: #60a5fa; font-size: 18px; font-weight: 700;">Order #${orderNumber}</p>
            ${customerName ? `<p style="margin: 4px 0; color: #9ca3af; font-size: 14px;">Customer: ${customerName}</p>` : ''}
            ${customerEmail ? `<p style="margin: 4px 0; color: #9ca3af; font-size: 14px;">Email: ${customerEmail}</p>` : ''}
          </td>
        </tr>
      </table>
    </div>

    ${artworkPreviewUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; color: #f97316; font-weight: 600;">Submitted Artwork:</p>
      <div style="background: #0f0f0f; border-radius: 8px; padding: 16px; display: inline-block;">
        <img src="${artworkPreviewUrl}" alt="Submitted Design" style="max-width: 100%; max-height: 300px; border-radius: 4px;">
      </div>
    </div>
    ` : ''}
  `;

  const html = generateEmailHtml({
    preheaderText: `${badgeEmoji} ${headline} - Order #${orderNumber}`,
    headline,
    subheadline: `Order #${orderNumber}`,
    bodyContent,
    ctaButton: {
      text: actionLabel,
      url: orderUrl,
      color,
    },
    showSocialLinks: false,
  });

  const text = generatePlainText({
    headline,
    bodyContent: `${message}\n\nOrder #${orderNumber}${customerName ? `\nCustomer: ${customerName}` : ''}${customerEmail ? `\nEmail: ${customerEmail}` : ''}`,
    ctaButton: {
      text: actionLabel,
      url: orderUrl,
    },
  });

      const success = await sendEmail(ADMIN_EMAILS.length === 1 ? ADMIN_EMAILS[0] : ADMIN_EMAILS, subject, html, text);
  if (success) {
    console.log(`Admin notification (${type}) sent for order ${orderNumber}`);
  }
  return success;
}

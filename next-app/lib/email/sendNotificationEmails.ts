import { generateEmailHtml, generatePlainText } from './template';
import { getEmailTemplate, replaceTemplateVariables, EmailType } from './getEmailTemplate';

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
  
  const template = await getEmailTemplate('artwork_approval');
  const vars = { orderNumber, customerName: customerName || 'there' };

  const subject = isFlagged 
    ? `Action Required: Artwork Updated - Order #${orderNumber} | Sticky Banditos`
    : replaceTemplateVariables(template.subject, vars);

  const headline = isFlagged
    ? "We've Updated Your Artwork"
    : replaceTemplateVariables(template.headline, vars);

  const message = isFlagged
    ? "We noticed an issue with your artwork and made some adjustments to ensure the best print quality. Please review the updated design below."
    : replaceTemplateVariables(template.bodyMessage, vars);

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
    subheadline: isFlagged ? 'Please review the changes we made' : (template.subheadline ? replaceTemplateVariables(template.subheadline, vars) : undefined),
    greeting: template.greeting ? replaceTemplateVariables(template.greeting, vars) : `Hi ${customerName || 'there'},`,
    bodyContent,
    ctaButton: {
      text: template.ctaButtonText,
      url: orderUrl,
      color: template.ctaButtonColor,
    },
    customFooterNote: template.footerMessage ? replaceTemplateVariables(template.footerMessage, vars) : undefined,
  });

  const text = generatePlainText({
    headline,
    greeting: template.greeting ? replaceTemplateVariables(template.greeting, vars) : `Hi ${customerName || 'there'},`,
    bodyContent: `${message}\n\nOrder #${orderNumber}`,
    ctaButton: {
      text: template.ctaButtonText,
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
  
  const typeToTemplateKey: Record<string, EmailType> = {
    'new_order': 'admin_new_order',
    'design_submitted': 'admin_design_submitted',
    'artwork_approved': 'admin_artwork_approved',
    'issue_flagged': 'admin_issue_flagged',
    'order_paid': 'admin_order_paid',
  };

  const templateKey = typeToTemplateKey[type];
  if (!templateKey) return false;

  const template = await getEmailTemplate(templateKey);
  const vars = { 
    orderNumber, 
    customerName: customerName || 'a customer',
    customerEmail: customerEmail || '',
    paymentAmount: paymentAmount || '',
  };

  const subject = replaceTemplateVariables(template.subject, vars);
  const headline = replaceTemplateVariables(template.headline, vars);
  let message = replaceTemplateVariables(template.bodyMessage, vars);
  
  if (type === 'order_paid' && paymentAmount) {
    message = message.replace('has successfully paid', `has successfully paid $${paymentAmount}`);
  }
  if (customerEmail) {
    message += ` (${customerEmail})`;
  }

  const actionLabel = template.ctaButtonText;
  const color = template.ctaButtonColor;
  const badgeEmoji = type === 'new_order' ? '💰' : 
                     type === 'design_submitted' ? '🎨' : 
                     type === 'artwork_approved' ? '✅' : 
                     type === 'issue_flagged' ? '⚠️' : '💳';

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

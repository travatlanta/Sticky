import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Sticky Banditos <noreply@stickybanditos.com>';
const SUPPORT_EMAIL = 'mhobbs.stickybanditos@gmail.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://stickybanditos.com';

export interface EmailOptions {
  to: string;
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

  const subject = `Message About Your Sticky Banditos Order #${orderId}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Sticky Banditos</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Custom Stickers & Labels</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                Hi ${customerName || 'there'},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                We have a message regarding your order <strong>#${orderId}</strong>:
              </p>
              
              <!-- Message Box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 20px 0; color: #333333; font-size: 16px; line-height: 1.5;">
                To respond to this message, please log into your account:
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 10px 0 30px 0;">
                    <a href="${messagesUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 8px;">
                      View Messages & Reply
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                <strong>Note:</strong> Please do not reply directly to this email as it is not monitored. Use the link above to reply through your account.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 13px; text-align: center;">
                Sticky Banditos Printing Company
              </p>
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 12px; text-align: center;">
                2 North 35th Ave, Phoenix, AZ 85009
              </p>
              <p style="margin: 0; color: #888888; font-size: 12px; text-align: center;">
                Phone: (602) 554-5338 | Email: ${SUPPORT_EMAIL}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
Hi ${customerName || 'there'},

We have a message regarding your Sticky Banditos order #${orderId}:

---
${message}
---

To respond to this message, please visit:
${messagesUrl}

Note: Please do not reply directly to this email as it is not monitored. Use the link above to reply through your account.

---
Sticky Banditos Printing Company
2 North 35th Ave, Phoenix, AZ 85009
Phone: (602) 554-5338
Email: ${SUPPORT_EMAIL}
`;

  return { subject, html, text };
}

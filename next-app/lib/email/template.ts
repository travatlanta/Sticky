const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.SITE_URL || 'https://stickybanditos.com';
const SUPPORT_EMAIL = 'mhobbs.stickybanditos@gmail.com';
const COMPANY_PHONE = '(602) 554-5338';
const COMPANY_ADDRESS = '2 North 35th Ave, Phoenix, AZ 85009';
const COMPANY_NAME = 'Sticky Banditos Printing Company';

export interface EmailTemplateOptions {
  preheaderText?: string;
  headline: string;
  subheadline?: string;
  greeting?: string;
  bodyContent: string;
  ctaButton?: {
    text: string;
    url: string;
    color?: 'orange' | 'green' | 'blue' | 'purple' | 'red';
  };
  secondaryButton?: {
    text: string;
    url: string;
  };
  showSocialLinks?: boolean;
  customFooterNote?: string;
  logoUrl?: string;
}

const buttonColors = {
  orange: { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', hover: '#dc2626' },
  green: { bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', hover: '#15803d' },
  blue: { bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', hover: '#1d4ed8' },
  purple: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', hover: '#6d28d9' },
  red: { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', hover: '#b91c1c' },
};

export function generateEmailHtml(options: EmailTemplateOptions): string {
  const {
    preheaderText,
    headline,
    subheadline,
    greeting,
    bodyContent,
    ctaButton,
    secondaryButton,
    showSocialLinks = true,
    customFooterNote,
    logoUrl,
  } = options;

  const ctaColors = ctaButton?.color ? buttonColors[ctaButton.color] : buttonColors.orange;
  const effectiveLogoUrl = logoUrl || `${SITE_URL}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>${headline}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; width: 100%; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 0 12px !important; }
      .content-padding { padding: 24px 20px !important; }
      .mobile-center { text-align: center !important; }
      .mobile-full { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  ${preheaderText ? `
  <div style="display: none; font-size: 1px; color: #0f0f0f; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${preheaderText}
  </div>
  ` : ''}
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f0f0f;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        
        <!-- Main Container -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="${SITE_URL}" style="display: inline-block;">
                <img src="${effectiveLogoUrl}" alt="Sticky Banditos" width="180" style="max-width: 180px; height: auto; display: block;" />
              </a>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(180deg, #1a1a1a 0%, #111111 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(249, 115, 22, 0.1);">
                
                <!-- Orange Accent Bar -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #f97316 0%, #fbbf24 50%, #f97316 100%);"></td>
                </tr>
                
                <!-- Header Section -->
                <tr>
                  <td class="content-padding" style="padding: 40px 40px 24px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <!-- Decorative Badge -->
                          <div style="display: inline-block; background: linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%); border: 1px solid rgba(249, 115, 22, 0.3); border-radius: 50px; padding: 8px 16px; margin-bottom: 20px;">
                            <span style="color: #f97316; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                              &#9733; Sticky Banditos &#9733;
                            </span>
                          </div>
                          
                          <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px;">
                            ${headline}
                          </h1>
                          ${subheadline ? `
                          <p style="margin: 0; color: #9ca3af; font-size: 16px; line-height: 1.5;">
                            ${subheadline}
                          </p>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Divider -->
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);"></div>
                  </td>
                </tr>
                
                <!-- Body Content -->
                <tr>
                  <td class="content-padding" style="padding: 24px 40px;">
                    ${greeting ? `
                    <p style="margin: 0 0 16px 0; color: #e5e7eb; font-size: 16px; line-height: 1.6;">
                      ${greeting}
                    </p>
                    ` : ''}
                    
                    <div style="color: #d1d5db; font-size: 15px; line-height: 1.7;">
                      ${bodyContent}
                    </div>
                  </td>
                </tr>
                
                <!-- CTA Buttons -->
                ${ctaButton ? `
                <tr>
                  <td class="content-padding" style="padding: 16px 40px 32px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="${ctaButton.url}" style="display: inline-block; background: ${ctaColors.bg}; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 0.5px;">
                            ${ctaButton.text}
                          </a>
                          ${secondaryButton ? `
                          <br><br>
                          <a href="${secondaryButton.url}" style="display: inline-block; color: #9ca3af; font-size: 14px; text-decoration: underline;">
                            ${secondaryButton.text}
                          </a>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Custom Footer Note -->
                ${customFooterNote ? `
                <tr>
                  <td style="padding: 0 40px 24px 40px;">
                    <div style="background-color: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 8px; padding: 16px;">
                      <p style="margin: 0; color: #fbbf24; font-size: 13px; line-height: 1.5;">
                        <strong style="color: #f97316;">&#9888; Note:</strong> ${customFooterNote}
                      </p>
                    </div>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Orange Accent Bar Bottom -->
                <tr>
                  <td style="height: 2px; background: linear-gradient(90deg, transparent 0%, rgba(249, 115, 22, 0.5) 50%, transparent 100%);"></td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- Company Info -->
                <tr>
                  <td align="center" style="padding-bottom: 20px;">
                    <p style="margin: 0 0 8px 0; color: #f97316; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">
                      ${COMPANY_NAME}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                      ${COMPANY_ADDRESS}<br>
                      <a href="tel:${COMPANY_PHONE.replace(/[^0-9+]/g, '')}" style="color: #9ca3af;">${COMPANY_PHONE}</a>
                      &nbsp;|&nbsp;
                      <a href="mailto:${SUPPORT_EMAIL}" style="color: #f97316;">${SUPPORT_EMAIL}</a>
                    </p>
                  </td>
                </tr>
                
                ${showSocialLinks ? `
                <!-- Social Links -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://facebook.com" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; color: #9ca3af; font-size: 14px;">f</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://instagram.com" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; color: #9ca3af; font-size: 14px;">&#9679;</a>
                        </td>
                        <td style="padding: 0 8px;">
                          <a href="https://twitter.com" style="display: inline-block; width: 36px; height: 36px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 36px; color: #9ca3af; font-size: 14px;">X</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}
                
                <!-- Legal Disclaimer -->
                <tr>
                  <td align="center" style="padding: 20px 20px 0 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 11px; line-height: 1.6; max-width: 500px;">
                      <strong style="color: #6b7280;">LEGAL DISCLAIMER:</strong> This email and any attachments are confidential and intended solely for the addressee. If you are not the intended recipient, please notify us immediately and delete this email. Do not copy, distribute, or take any action based on this email. Sticky Banditos Printing Company is not liable for any errors, omissions, or viruses in this transmission.
                    </p>
                    <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 11px; line-height: 1.6;">
                      &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
                      Custom stickers, labels, and printing services in Phoenix, Arizona.
                    </p>
                    <p style="margin: 0; color: #374151; font-size: 11px;">
                      <a href="${SITE_URL}/privacy" style="color: #6b7280; text-decoration: underline;">Privacy Policy</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <a href="${SITE_URL}/terms" style="color: #6b7280; text-decoration: underline;">Terms of Service</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <a href="${SITE_URL}/contact" style="color: #6b7280; text-decoration: underline;">Contact Us</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Unsubscribe (for marketing emails) -->
                <tr>
                  <td align="center" style="padding: 20px;">
                    <p style="margin: 0; color: #374151; font-size: 10px;">
                      You're receiving this email because you have an account with Sticky Banditos or placed an order with us.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generatePlainText(options: {
  headline: string;
  greeting?: string;
  bodyContent: string;
  ctaButton?: { text: string; url: string };
  customFooterNote?: string;
}): string {
  const { headline, greeting, bodyContent, ctaButton, customFooterNote } = options;
  
  const plainBody = bodyContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  return `
${'='.repeat(50)}
STICKY BANDITOS PRINTING COMPANY
${'='.repeat(50)}

${headline.toUpperCase()}

${greeting ? `${greeting}\n\n` : ''}${plainBody}

${ctaButton ? `\n>>> ${ctaButton.text}: ${ctaButton.url}\n` : ''}
${customFooterNote ? `\nNOTE: ${customFooterNote}\n` : ''}
${'─'.repeat(50)}

${COMPANY_NAME}
${COMPANY_ADDRESS}
Phone: ${COMPANY_PHONE}
Email: ${SUPPORT_EMAIL}
Website: ${SITE_URL}

${'─'.repeat(50)}

LEGAL DISCLAIMER: This email and any attachments are confidential and intended solely for the addressee. If you are not the intended recipient, please notify us immediately and delete this email. Do not copy, distribute, or take any action based on this email.

(c) ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
`;
}

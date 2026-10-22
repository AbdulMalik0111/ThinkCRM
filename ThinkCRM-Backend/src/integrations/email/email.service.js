import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';
import { logger } from '../../utils/logger.js';

export const getTransporter = () => {
  // If MAILTRAP_TOKEN is configured in .env, use Mailtrap API transport
  if (process.env.MAILTRAP_TOKEN) {
    const isSandbox = Boolean(process.env.MAILTRAP_INBOX_ID);
    return nodemailer.createTransport(
      MailtrapTransport({
        token: process.env.MAILTRAP_TOKEN,
        sandbox: isSandbox,
        testInboxId: process.env.MAILTRAP_INBOX_ID ? Number(process.env.MAILTRAP_INBOX_ID) : undefined,
      })
    );
  }

  // Standard SMTP fallback (Hostinger, Gmail, Brevo, SendPulse, custom SMTP)
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const verifySmtpConnection = async () => {
  if (process.env.MAILTRAP_TOKEN) {
    return { success: true, message: 'Mailtrap API Transport is active & configured' };
  }
  const transporter = getTransporter();
  try {
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

/**
 * Universal branded HTML email template featuring ThinkTive logo
 */
export const wrapWithEmailTemplate = (contentHtml) => {
  const logoUrl =
    process.env.LOGO_URL ||
    'https://res.cloudinary.com/l2v98o7i/image/upload/v1792699749/thinkcrm/branding/thinktive_email_logo.png';
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0" border="0">
          <!-- Header with ThinkTive Logo -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 32px; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: middle;">
                    <a href="https://crm.thinktive.us" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${logoUrl}" alt="ThinkTive. IT Solution" width="220" height="49" style="height: 42px; width: auto; max-width: 220px; display: block; border: 0; outline: none; text-decoration: none;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} ThinkTive. All rights reserved.</p>
              <p style="margin: 0;">Sent via <a href="https://crm.thinktive.us" style="color: #3b82f6; text-decoration: none;">ThinkTive CRM</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const sendEmail = async ({
  to,
  cc,
  bcc,
  subject,
  html,
  text,
  attachments = [],
  category = 'CRM Notification',
}) => {
  try {
    const transporter = getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.MAILTRAP_TOKEN ? 'hello@demomailtrap.co' : 'noreply@thinkcrm.com');
    const fromName = process.env.EMAIL_FROM_NAME || 'ThinkTive CRM';

    // Wrap in branded email template with logo if not already a full document
    const finalHtml = html
      ? (html.includes('<!DOCTYPE') || html.includes('<html') ? html : wrapWithEmailTemplate(html))
      : (text ? wrapWithEmailTemplate(`<p>${text.replace(/\n/g, '<br>')}</p>`) : undefined);

    // Sanitize attachments for Nodemailer (supports Buffers, base64, URLs, and file paths)
    const validAttachments = (attachments || [])
      .map((att) => {
        if (!att) return null;
        // If attachment has buffer or string content
        if (att.content !== undefined && att.content !== null) {
          return {
            filename: att.filename || 'attachment',
            content: att.content,
            encoding: att.encoding || (typeof att.content === 'string' && !att.content.includes('\n') ? 'base64' : undefined),
            contentType: att.contentType || att.fileType,
          };
        }
        // If attachment has path or url
        const filePath = att.path || att.url;
        if (filePath) {
          return {
            filename: att.filename || 'attachment',
            path: filePath,
            contentType: att.contentType || att.fileType,
          };
        }
        // Skip dummy metadata-only objects
        logger.warn(`[sendEmail] Skipping invalid attachment missing content and path: ${JSON.stringify(att.filename || att)}`);
        return null;
      })
      .filter(Boolean);

    const mailOptions = {
      from: {
        address: fromAddress,
        name: fromName,
      },
      to,
      subject,
      html: finalHtml,
      attachments: validAttachments,
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (text) mailOptions.text = text;
    if (category) mailOptions.category = category;

    const info = await transporter.sendMail(mailOptions);
    const msgId = info.messageId || (Array.isArray(info.message_ids) ? info.message_ids.join(', ') : 'delivered');
    logger.info(`Email sent successfully [${msgId}] to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

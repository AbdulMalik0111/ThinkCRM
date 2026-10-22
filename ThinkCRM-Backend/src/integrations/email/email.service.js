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

  // Standard SMTP fallback (Gmail, Brevo, SendPulse, custom SMTP)
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

export const sendEmail = async ({
  to,
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
    const fromName = process.env.EMAIL_FROM_NAME || 'ThinkCRM';

    const mailOptions = {
      from: {
        address: fromAddress,
        name: fromName,
      },
      to,
      subject,
      html,
      attachments,
    };

    if (text) {
      mailOptions.text = text;
    }
    if (category) {
      mailOptions.category = category;
    }

    const info = await transporter.sendMail(mailOptions);
    const msgId = info.messageId || (Array.isArray(info.message_ids) ? info.message_ids.join(', ') : 'delivered');
    logger.info(`Email sent successfully [${msgId}] to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

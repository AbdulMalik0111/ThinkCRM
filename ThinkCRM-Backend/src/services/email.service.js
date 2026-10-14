import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter;

const createTransporter = () => {
  if (transporter) return transporter;

  // Configure nodemailer using SMTP. In production, provide env variables.
  // For dev, it can fallback to ethereal or gmail if provided
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS, 
    },
  });

  return transporter;
};

/**
 * Sends an email
 * @param {Object} options 
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
export const sendEmail = async ({ to, cc, bcc, subject, text, html, attachments }) => {
  try {
    const t = createTransporter();
    
    // Only send if auth is provided, otherwise log a warning
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP credentials missing. Email would have been sent:');
      logger.warn(`To: ${to} | Subject: ${subject}`);
      return { success: true, mocked: true, message: 'SMTP credentials not configured. Email logged in console.' };
    }

    const mailOptions = {
      from: `"ThinkCRM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (attachments && Array.isArray(attachments)) {
      mailOptions.attachments = attachments;
    }

    const info = await t.sendMail(mailOptions);

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

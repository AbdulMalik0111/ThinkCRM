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
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const t = createTransporter();
    
    // Only send if auth is provided, otherwise log a warning
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('SMTP credentials missing. Email would have been sent:');
      logger.warn(`To: ${to} | Subject: ${subject}`);
      return false;
    }

    const info = await t.sendMail({
      from: `"ThinkCRM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

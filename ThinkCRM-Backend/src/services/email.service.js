import { sendEmail as integrationSendEmail, verifySmtpConnection, getTransporter } from '../integrations/email/email.service.js';

export { verifySmtpConnection, getTransporter };

/**
 * Universal sendEmail wrapper forwarding to integrations/email/email.service.js
 */
export const sendEmail = async (options) => {
  return integrationSendEmail(options);
};

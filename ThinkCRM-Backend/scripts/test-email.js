import 'dotenv/config';
import { verifySmtpConnection, sendEmail } from '../src/integrations/email/email.service.js';

const recipient = process.argv[2] || (process.env.MAILTRAP_TOKEN ? 'wikimov734@moravita.com' : process.env.SMTP_USER);

async function testEmailSetup() {
  console.log('\n=============================================');
  console.log('       ThinkCRM - Email Delivery Tester      ');
  console.log('=============================================');

  const isMailtrap = Boolean(process.env.MAILTRAP_TOKEN);

  if (isMailtrap) {
    console.log(`Transport : Mailtrap API Transport (via mailtrap SDK)`);
    console.log(`Token     : ${process.env.MAILTRAP_TOKEN.substring(0, 8)}... (configured)`);
    console.log(`Email From: ${process.env.EMAIL_FROM || 'hello@demomailtrap.co'}`);
    console.log(`Testing to: ${recipient || 'wikimov734@moravita.com'}`);
  } else {
    console.log(`Transport : Standard SMTP`);
    console.log(`SMTP Host : ${process.env.SMTP_HOST || 'Not set'}`);
    console.log(`SMTP Port : ${process.env.SMTP_PORT || 'Not set'}`);
    console.log(`SMTP User : ${process.env.SMTP_USER || 'Not set'}`);
    console.log(`Email From: ${process.env.EMAIL_FROM || process.env.SMTP_USER || 'Not set'}`);
    console.log(`Testing to: ${recipient || 'Not specified'}`);
  }
  console.log('---------------------------------------------');

  if (!isMailtrap && (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD)) {
    console.error('❌ Error: Neither MAILTRAP_TOKEN nor SMTP credentials are fully configured in .env!');
    process.exit(1);
  }

  console.log('1. Verifying transport configuration...');
  const verifyResult = await verifySmtpConnection();
  if (!verifyResult.success) {
    console.error(`❌ Verification failed: ${verifyResult.message}`);
    process.exit(1);
  }
  console.log(`✅ ${verifyResult.message}\n`);

  if (!recipient) {
    console.log('Pass an email address as an argument to send a test email:');
    console.log('Example: node scripts/test-email.js wikimov734@moravita.com');
    process.exit(0);
  }

  console.log(`2. Dispatching test email to: ${recipient}...`);
  try {
    const result = await sendEmail({
      to: recipient,
      subject: '🎉 ThinkCRM & Mailtrap - Email Integration Working!',
      text: 'Congratulations! ThinkCRM is now successfully connected to Mailtrap.',
      category: 'Integration Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0;">🎉 Email Delivery Successful!</h2>
          <p style="color: #334155; line-height: 1.6;">
            Your ThinkCRM backend is now successfully integrated with Mailtrap to dispatch emails, quotation PDFs, and customer follow-ups.
          </p>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>Provider:</strong> ${isMailtrap ? 'Mailtrap API (mailtrap SDK)' : process.env.SMTP_HOST}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>From:</strong> ${process.env.EMAIL_FROM || 'hello@demomailtrap.co'}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>Recipient:</strong> ${recipient}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
            Check your live email logs anytime at: <a href="https://mailtrap.io/sending/email_logs">https://mailtrap.io/sending/email_logs</a>
          </p>
        </div>
      `,
    });

    const msgId = result.messageId || (Array.isArray(result.message_ids) ? result.message_ids.join(', ') : 'OK');
    console.log(`✅ Success! Email delivered via ${isMailtrap ? 'Mailtrap' : process.env.SMTP_HOST} (ID: ${msgId})`);
    if (isMailtrap) {
      console.log(`👉 View sent email log at: https://mailtrap.io/sending/email_logs`);
    }
    console.log(`👉 Check inbox for: ${recipient}`);
  } catch (sendErr) {
    console.error(`❌ Failed to send email: ${sendErr.message}`);
  }
}

testEmailSetup();

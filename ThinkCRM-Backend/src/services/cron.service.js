import cron from 'node-cron';
import axios from 'axios';
import { FollowUp } from '../models/FollowUp.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Setting } from '../models/Setting.js';
import { sendEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

/**
 * Auto-Keepalive to prevent cloud hosting (e.g., Render Free Tier) from sleeping/suspending cron
 */
const startKeepAlive = () => {
  const url = process.env.BACKEND_URL || 'https://thinkcrm.onrender.com/api/v1/health';
  logger.info(`Keep-alive heartbeat active for ${url}`);

  // Ping every 4 minutes (240,000 ms)
  setInterval(async () => {
    try {
      await axios.get(url, { timeout: 10000 });
    } catch (err) {
      // Quietly ignore transient network errors
    }
  }, 4 * 60 * 1000);
};

/**
 * Format date in business / local timezone (defaults to Asia/Kolkata / IST)
 */
export const formatFollowUpTime = (dateObj) => {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: tz,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateObj));
    return `${formatted} (IST)`;
  } catch (err) {
    return new Date(dateObj).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' (IST)';
  }
};

/**
 * Send reminder email for a specific time window
 */
const sendReminder = async (followup, timeLabel, reminderType = '10m') => {
  if (!followup.assignedTo || !followup.assignedTo.email) return;

  const contactName =
    followup.leadId?.fullName ||
    (followup.leadId?.firstName ? `${followup.leadId.firstName} ${followup.leadId.lastName || ''}`.trim() : null) ||
    followup.customerId?.fullName ||
    (followup.customerId?.firstName ? `${followup.customerId.firstName} ${followup.customerId.lastName || ''}`.trim() : null) ||
    'Client / Lead';

  const contactPhone = followup.leadId?.phone || followup.customerId?.phone || '';
  const contactEmail = followup.leadId?.email || followup.customerId?.email || '';

  const timeFormatted = formatFollowUpTime(followup.scheduledAt);

  let badgeColor = '#b45309';
  let badgeBg = '#fef3c7';
  let badgeText = '⏰ 10-Minute Reminder';
  let headline = `Follow-up in 10 Minutes with ${contactName}`;
  let subject = `⏰ [10-Min Reminder] Follow-up with ${contactName} · ${timeFormatted}`;

  if (reminderType === '5m') {
    badgeColor = '#c2410c';
    badgeBg = '#ffedd5';
    badgeText = '⏰ 5-Minute Reminder';
    headline = `Follow-up in 5 Minutes with ${contactName}`;
    subject = `⏰ [5-Min Reminder] Follow-up with ${contactName} · ${timeFormatted}`;
  } else if (reminderType === '0m') {
    badgeColor = '#b91c1c';
    badgeBg = '#fee2e2';
    badgeText = '🚨 Due Now - Action Required';
    headline = `Follow-up Due Now with ${contactName}`;
    subject = `🚨 [DUE NOW] Follow-up with ${contactName} · ${timeFormatted}`;
  }

  const rawType = followup.type || 'call';
  const typeCapitalized = rawType.charAt(0).toUpperCase() + rawType.slice(1);
  const rawPriority = followup.priority || 'medium';
  const priorityCapitalized = rawPriority.charAt(0).toUpperCase() + rawPriority.slice(1);
  const crmUrl = process.env.FRONTEND_URL || 'https://crm.thinktive.us';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; color: ${badgeColor}; background-color: ${badgeBg}; margin-bottom: 16px;">
        ${badgeText}
      </div>

      <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">
        ${headline}
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 15px; color: #475569; line-height: 1.6;">
        Hello <strong>${followup.assignedTo.firstName || 'Team'}</strong>,<br/>
        ${
          reminderType === '0m'
            ? `Your scheduled <strong>${typeCapitalized}</strong> follow-up is due <strong>right now</strong>.`
            : `This is a friendly reminder that your scheduled <strong>${typeCapitalized}</strong> follow-up is starting ${timeLabel}.`
        }
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Contact:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${contactName}</td>
          </tr>
          ${
            contactPhone
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 0;"><a href="tel:${contactPhone}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${contactPhone}</a></td>
                </tr>`
              : ''
          }
          ${
            contactEmail
              ? `<tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 0;"><a href="mailto:${contactEmail}" style="color: #2563eb; text-decoration: none;">${contactEmail}</a></td>
                </tr>`
              : ''
          }
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Follow-up Type:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${typeCapitalized}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Scheduled Time:</td>
            <td style="padding: 6px 0; color: #0284c7; font-weight: 700;">${timeFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Priority:</td>
            <td style="padding: 6px 0; color: #0f172a;">${priorityCapitalized}</td>
          </tr>
          ${
            followup.notes
              ? `<tr>
                  <td style="padding: 10px 0 0 0; color: #64748b; font-weight: 600; vertical-align: top;">Notes:</td>
                  <td style="padding: 10px 0 0 0; color: #334155; font-style: italic;">"${followup.notes}"</td>
                </tr>`
              : ''
          }
        </table>
      </div>

      <div style="margin-top: 24px; text-align: left;">
        <a href="${crmUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Open in ThinkCRM &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        This is an automated reminder notification from ThinkCRM.
      </p>
    </div>
  `;

  const text = `Follow-up Reminder (${badgeText})\n\nHello ${followup.assignedTo.firstName || 'Team'},\n\nYour ${typeCapitalized} follow-up with ${contactName} is scheduled for ${timeFormatted}.\n\nContact: ${contactName}\nPhone: ${contactPhone || 'N/A'}\nNotes: ${followup.notes || 'None'}\n\nPlease check your ThinkCRM dashboard: ${crmUrl}`;

  await sendEmail({
    to: followup.assignedTo.email,
    subject,
    text,
    html,
  });
};

export const startCronJobs = () => {
  logger.info('Starting FollowUp reminder cron jobs...');

  // Start self-ping keep-alive so cloud instances (Render) never sleep
  startKeepAlive();

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Look for pending or overdue followups that are not completed/cancelled
      const activeFollowups = await FollowUp.find({
        status: { $in: ['pending', 'overdue'] },
      })
        .populate('assignedTo', 'firstName lastName email')
        .populate('leadId', 'fullName firstName lastName phone email')
        .populate('customerId', 'fullName firstName lastName phone email');

      for (const followup of activeFollowups) {
        try {
          if (!followup.assignedTo?.email) continue;

          const scheduledTime = new Date(followup.scheduledAt);
          if (isNaN(scheduledTime.getTime())) continue;

          // diffMinutes: positive in the future, 0 at exact time, negative in the past
          const diffMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);

          // 1) 10-Minute Reminder
          // Fires when between 11 and 6 minutes remain
          if (!followup.reminder10mSent && diffMinutes <= 11 && diffMinutes > 6) {
            await sendReminder(followup, 'in 10 minutes', '10m');
            await FollowUp.findByIdAndUpdate(followup._id, { $set: { reminder10mSent: true } });
            logger.info(`10m reminder sent for followup ${followup._id} to ${followup.assignedTo.email}`);
          }
          // 2) 5-Minute Reminder
          // Fires when between 6 and 1 minutes remain
          else if (!followup.reminder5mSent && diffMinutes <= 6 && diffMinutes > 1) {
            await sendReminder(followup, 'in 5 minutes', '5m');
            await FollowUp.findByIdAndUpdate(followup._id, { $set: { reminder5mSent: true } });
            logger.info(`5m reminder sent for followup ${followup._id} to ${followup.assignedTo.email}`);
          }
          // 3) At Scheduled Time (Due Now) Reminder
          // Fires when 1 minute or less remains, or within 120 minutes overdue
          else if (!followup.reminder0mSent && diffMinutes <= 1 && diffMinutes >= -120) {
            await sendReminder(followup, 'NOW', '0m');
            await FollowUp.findByIdAndUpdate(followup._id, { $set: { reminder0mSent: true } });
            logger.info(`0m (NOW) reminder sent for followup ${followup._id} to ${followup.assignedTo.email}`);
          }
        } catch (itemErr) {
          logger.error(`Error processing reminder for followup ${followup._id}: ${itemErr.message}`);
        }
      }
    } catch (error) {
      logger.error(`Error running reminder cron job: ${error.message}`);
    }
  });
};

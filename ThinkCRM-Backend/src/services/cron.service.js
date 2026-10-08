import cron from 'node-cron';
import { FollowUp } from '../models/FollowUp.js';
import { sendEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

/**
 * Send reminder email for a specific time window
 */
const sendReminder = async (followup, timeLabel) => {
  if (!followup.assignedTo || !followup.assignedTo.email) return;

  const leadName = followup.leadId ? `${followup.leadId.firstName} ${followup.leadId.lastName}` : 'a Lead';
  
  // Format: "3:00 PM on Oct 10, 2026"
  const timeFormatted = new Date(followup.scheduledAt).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const subject = `Reminder: Follow-up with ${leadName} ${timeLabel}`;
  const text = `Hello ${followup.assignedTo.firstName},\n\nThis is a reminder that you have a scheduled ${followup.type} follow-up with ${leadName} at ${timeFormatted}.\n\nNotes: ${followup.notes || 'None'}\n\nPlease check your ThinkCRM Admin Panel for more details.\n\nBest,\nThinkCRM System`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0f172a;">Follow-up Reminder</h2>
      <p>Hello ${followup.assignedTo.firstName},</p>
      <p>This is a friendly reminder that you have a scheduled <strong>${followup.type}</strong> follow-up with <strong>${leadName}</strong>.</p>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0;"><strong>Scheduled Time:</strong> ${timeFormatted}</p>
        <p style="margin: 0;"><strong>Notes:</strong> ${followup.notes || 'None'}</p>
      </div>
      <p>Please log in to your ThinkCRM dashboard to review the lead details and take action.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">This is an automated message from ThinkCRM.</p>
    </div>
  `;

  await sendEmail({
    to: followup.assignedTo.email,
    subject,
    text,
    html
  });
};

export const startCronJobs = () => {
  logger.info('Starting FollowUp reminder cron jobs...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Look for pending followups that are not overdue/cancelled
      const pendingFollowups = await FollowUp.find({
        status: 'pending',
      }).populate('assignedTo', 'firstName lastName email').populate('leadId', 'firstName lastName');

      for (const followup of pendingFollowups) {
        const scheduledTime = new Date(followup.scheduledAt);
        const diffMinutes = (scheduledTime - now) / (1000 * 60);

        // 10 minutes reminder
        if (diffMinutes <= 10 && diffMinutes > 5 && !followup.reminder10mSent) {
          await sendReminder(followup, 'in 10 minutes');
          followup.reminder10mSent = true;
          await followup.save();
          logger.info(`10m reminder sent for followup ${followup._id}`);
        }
        
        // 5 minutes reminder
        if (diffMinutes <= 5 && diffMinutes > 0 && !followup.reminder5mSent) {
          await sendReminder(followup, 'in 5 minutes');
          followup.reminder5mSent = true;
          await followup.save();
          logger.info(`5m reminder sent for followup ${followup._id}`);
        }

        // Exact time reminder (0 minutes left or just passed)
        if (diffMinutes <= 0 && diffMinutes > -5 && !followup.reminder0mSent) {
          await sendReminder(followup, 'NOW');
          followup.reminder0mSent = true;
          await followup.save();
          logger.info(`0m (NOW) reminder sent for followup ${followup._id}`);
        }
      }
    } catch (error) {
      logger.error('Error running reminder cron job:', error);
    }
  });
};

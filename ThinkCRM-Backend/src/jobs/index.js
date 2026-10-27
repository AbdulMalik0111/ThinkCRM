import cron from 'node-cron';
import { FollowUp } from '../models/FollowUp.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Setting } from '../models/Setting.js';
import { logActivity } from '../services/activity.service.js';
import { createNotification } from '../services/notification.service.js';
import { startCronJobs } from '../services/cron.service.js';
import { logger } from '../utils/logger.js';

export const startJobs = () => {
  // Start email reminder cron jobs
  startCronJobs();

  // Run every hour to check for overdue follow-ups (with 15 min grace window)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running cron job: Check overdue follow-ups');
      const overdueThreshold = new Date(Date.now() - 15 * 60 * 1000);
      
      const overdueFollowUps = await FollowUp.find({
        status: 'pending',
        scheduledAt: { $lt: overdueThreshold },
      });

      for (const followUp of overdueFollowUps) {
        followUp.status = 'overdue';
        await followUp.save();

        if (followUp.assignedTo) {
          await createNotification({
            recipient: followUp.assignedTo,
            type: 'follow_up_overdue',
            title: 'Overdue Follow-up',
            message: `Your scheduled follow-up (${followUp.type}) is now overdue.`,
            entityType: 'FollowUp',
            entityId: followUp._id,
          });
        }
      }
      
      logger.info(`Marked ${overdueFollowUps.length} follow-ups as overdue`);
    } catch (error) {
      logger.error(`Cron job failed: ${error.message}`);
    }
  });
};

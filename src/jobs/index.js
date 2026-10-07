import cron from 'node-cron';
import { FollowUp } from '../models/FollowUp.js';
import { logActivity } from '../services/activity.service.js';
import { createNotification } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

export const startJobs = () => {
  // Run every hour to check for overdue follow-ups
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running cron job: Check overdue follow-ups');
      const now = new Date();
      
      const overdueFollowUps = await FollowUp.find({
        status: 'pending',
        scheduledAt: { $lt: now },
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

import { FollowUp } from '../models/FollowUp.js';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

export const createFollowUp = async (leadId, data, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const followUp = await FollowUp.create({
    ...data,
    leadId,
    createdBy,
    assignedTo: data.assignedTo || lead.assignedTo,
  });

  lead.nextFollowUpAt = followUp.scheduledAt;
  await lead.save();

  await logActivity({
    leadId,
    type: 'follow_up_created',
    description: `Follow-up (${data.type}) scheduled for ${new Date(data.scheduledAt).toLocaleString()}`,
    performedBy: createdBy,
    metadata: { followUpId: followUp._id },
  });

  if (followUp.assignedTo && followUp.assignedTo.toString() !== createdBy.toString()) {
    await createNotification({
      recipient: followUp.assignedTo,
      type: 'system',
      title: 'New Follow-up Assigned',
      message: `A new ${data.type} follow-up has been assigned to you for lead ${lead.fullName}.`,
      entityType: 'Lead',
      entityId: lead._id,
    });
  }

  return followUp;
};

export const updateFollowUp = async (followUpId, data, updatedBy) => {
  const followUp = await FollowUp.findById(followUpId).populate('leadId');
  if (!followUp) {
    throw new AppError('Follow-up not found', 404);
  }

  const oldStatus = followUp.status;
  
  Object.assign(followUp, data);

  if (data.status === 'completed' && oldStatus !== 'completed') {
    followUp.completedAt = Date.now();
  }

  await followUp.save();

  if (data.status && data.status !== oldStatus) {
    await logActivity({
      leadId: followUp.leadId._id,
      type: data.status === 'completed' ? 'follow_up_completed' : 'status_changed',
      description: `Follow-up status changed to ${data.status}`,
      performedBy: updatedBy,
      metadata: { followUpId: followUp._id, status: data.status },
    });
  }

  return followUp;
};

export const getLeadFollowUps = async (leadId) => {
  return await FollowUp.find({ leadId }).sort({ scheduledAt: 1 }).populate('assignedTo', 'firstName lastName');
};

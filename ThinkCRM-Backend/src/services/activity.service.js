import { Activity } from '../models/Activity.js';

export const logActivity = async ({ leadId, type, description, metadata, performedBy }) => {
  return await Activity.create({
    leadId,
    type,
    description,
    metadata,
    performedBy,
  });
};

export const getLeadActivities = async (leadId) => {
  return await Activity.find({ leadId }).sort({ createdAt: -1 }).populate('performedBy', 'firstName lastName avatar');
};

import { Activity } from '../models/Activity.js';

export const logActivity = async ({ leadId, customerId, type, description, metadata, performedBy }) => {
  const data = {
    type,
    description,
    metadata,
    performedBy,
  };
  if (leadId) data.leadId = leadId;
  if (customerId) data.customerId = customerId;

  return await Activity.create(data);
};

export const getLeadActivities = async (leadId) => {
  return await Activity.find({ leadId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'firstName lastName avatar');
};

export const getCustomerActivities = async (customerId, leadId) => {
  const or = [];
  if (customerId) or.push({ customerId });
  if (leadId) or.push({ leadId });

  const query = or.length > 0 ? { $or: or } : {};
  return await Activity.find(query)
    .sort({ createdAt: -1 })
    .populate('performedBy', 'firstName lastName avatar email');
};

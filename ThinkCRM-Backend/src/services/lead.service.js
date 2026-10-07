import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';

export const createLead = async (leadData, createdBy) => {
  if (leadData.metaLeadId) {
    const existing = await Lead.findOne({ metaLeadId: leadData.metaLeadId });
    if (existing) {
      throw new AppError('Lead from this Meta webhook already exists', 400);
    }
  }

  const lead = await Lead.create({
    ...leadData,
    createdBy,
  });

  await logActivity({
    leadId: lead._id,
    type: 'lead_created',
    description: 'Lead was created',
    performedBy: createdBy,
  });

  return lead;
};

export const getLeads = async (query = {}) => {
  // basic filtering
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.source) filter.leadSource = query.source;
  if (query.priority) filter.priority = query.priority;
  if (query.projectType) filter.projectType = query.projectType;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const sort = {};
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    sort[field] = order === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const total = await Lead.countDocuments(filter);
  const leads = await Lead.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('assignedTo', 'firstName lastName avatar')
    .populate('createdBy', 'firstName lastName');

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getLeadById = async (leadId) => {
  const lead = await Lead.findById(leadId)
    .populate('assignedTo', 'firstName lastName avatar')
    .populate('createdBy', 'firstName lastName');
  
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  return lead;
};

export const updateLead = async (leadId, updateData, updatedBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const oldStatus = lead.status;
  
  Object.assign(lead, updateData);
  await lead.save();

  await logActivity({
    leadId: lead._id,
    type: 'lead_updated',
    description: 'Lead details were updated',
    performedBy: updatedBy,
  });

  if (updateData.status && updateData.status !== oldStatus) {
    await logActivity({
      leadId: lead._id,
      type: 'status_changed',
      description: `Status changed from ${oldStatus} to ${updateData.status}`,
      performedBy: updatedBy,
      metadata: { oldStatus, newStatus: updateData.status },
    });
  }

  return lead;
};

export const deleteLead = async (leadId, deletedBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }
  
  lead.isDeleted = true;
  lead.deletedAt = Date.now();
  await lead.save();

  await logActivity({
    leadId: lead._id,
    type: 'lead_updated',
    description: 'Lead was deleted',
    performedBy: deletedBy,
  });
};

export const assignLead = async (leadId, assignedTo, assignedBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const type = lead.assignedTo ? 'lead_reassigned' : 'lead_assigned';
  lead.assignedTo = assignedTo;
  await lead.save();

  await logActivity({
    leadId: lead._id,
    type,
    description: `Lead assigned to user ${assignedTo}`,
    performedBy: assignedBy,
    metadata: { assignedTo },
  });

  return lead;
};

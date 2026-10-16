import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { convertLeadToCustomer as convertService } from './customer.service.js';

/**
 * Calculate KPI Stats for Leads Dashboard (Real database counts & historical comparison)
 */
export const getLeadStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalLeads,
    totalPrev,
    newLeads,
    newPrev,
    contactedLeads,
    contactedPrev,
    qualifiedLeads,
    qualifiedPrev,
    convertedLeads,
    convertedPrev,
  ] = await Promise.all([
    Lead.countDocuments({ isDeleted: false }),
    Lead.countDocuments({ createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }, isDeleted: false }),
    Lead.countDocuments({ status: 'new', isDeleted: false }),
    Lead.countDocuments({ status: 'new', createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }, isDeleted: false }),
    Lead.countDocuments({ status: { $in: ['contacted', 'attempted', 'in_progress', 'follow_up'] }, isDeleted: false }),
    Lead.countDocuments({ status: { $in: ['contacted', 'attempted', 'in_progress', 'follow_up'] }, createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }, isDeleted: false }),
    Lead.countDocuments({ status: 'qualified', isDeleted: false }),
    Lead.countDocuments({ status: 'qualified', createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }, isDeleted: false }),
    Lead.countDocuments({ status: { $in: ['won', 'converted'] }, isDeleted: false }),
    Lead.countDocuments({ status: { $in: ['won', 'converted'] }, createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo }, isDeleted: false }),
  ]);

  const calcChange = (curr, prev) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    total: {
      value: totalLeads,
      changePercent: calcChange(totalLeads, totalPrev),
      isPositive: totalLeads >= totalPrev,
    },
    newLeads: {
      value: newLeads,
      changePercent: calcChange(newLeads, newPrev),
      isPositive: newLeads >= newPrev,
    },
    contacted: {
      value: contactedLeads,
      changePercent: calcChange(contactedLeads, contactedPrev),
      isPositive: contactedLeads >= contactedPrev,
    },
    qualified: {
      value: qualifiedLeads,
      changePercent: calcChange(qualifiedLeads, qualifiedPrev),
      isPositive: qualifiedLeads >= qualifiedPrev,
    },
    converted: {
      value: convertedLeads,
      changePercent: calcChange(convertedLeads, convertedPrev),
      isPositive: convertedLeads >= convertedPrev,
    },
  };
};

export const createLead = async (leadData, createdBy) => {
  if (leadData.metaLeadId) {
    const existing = await Lead.findOne({ metaLeadId: leadData.metaLeadId });
    if (existing) {
      throw new AppError('Lead from this Meta webhook already exists', 400);
    }
  }

  // Extract initial follow-up payload if provided
  const { nextFollowUpDate, nextFollowUpTime, nextFollowUpType, sendReminderNotification, ...leadFields } = leadData;

  const lead = await Lead.create({
    ...leadFields,
    createdBy,
  });

  await logActivity({
    leadId: lead._id,
    type: 'lead_created',
    description: `Lead created for ${lead.fullName} (${lead.projectType || 'Project'}) via ${lead.leadSource || 'Website'}`,
    performedBy: createdBy,
  });

  // Schedule initial follow-up if date is provided
  if (nextFollowUpDate) {
    try {
      const scheduledAt = nextFollowUpTime
        ? new Date(`${nextFollowUpDate}T${nextFollowUpTime}`)
        : new Date(nextFollowUpDate);

      const followUp = await FollowUp.create({
        leadId: lead._id,
        assignedTo: lead.assignedTo || createdBy,
        type: nextFollowUpType || 'call',
        scheduledAt: isNaN(scheduledAt.getTime()) ? new Date() : scheduledAt,
        notes: lead.notes || 'Initial follow-up scheduled on lead creation',
        status: 'pending',
        createdBy,
      });

      lead.nextFollowUpAt = followUp.scheduledAt;
      await lead.save();

      await logActivity({
        leadId: lead._id,
        type: 'follow_up_created',
        description: `Initial follow-up (${followUp.type}) scheduled for ${new Date(followUp.scheduledAt).toLocaleString()}`,
        performedBy: createdBy,
        metadata: { followUpId: followUp._id },
      });
    } catch (e) {
      // Continue lead creation even if initial follow-up date string parsing failed
    }
  }

  return lead;
};

export const getLeads = async (query = {}) => {
  const filter = { isDeleted: { $ne: true } };

  // Status Filter
  if (query.status && query.status !== 'all' && query.status !== '') {
    if (query.status === 'converted') {
      filter.status = { $in: ['won', 'converted'] };
    } else {
      filter.status = query.status;
    }
  }

  // Source Filter
  if (query.source && query.source !== 'all' && query.source !== '') {
    filter.leadSource = query.source;
  }

  // Priority Filter
  if (query.priority && query.priority !== 'all' && query.priority !== '') {
    filter.priority = query.priority;
  }

  // Project Type Filter
  if (query.projectType && query.projectType !== 'all' && query.projectType !== '') {
    filter.projectType = query.projectType;
  }

  // Assigned Staff Filter
  if (query.assignedTo && query.assignedTo !== 'all' && query.assignedTo !== '') {
    if (query.assignedTo === 'unassigned') {
      filter.assignedTo = { $exists: false };
    } else {
      filter.assignedTo = query.assignedTo;
    }
  }

  // Date Range Filter (createdAt)
  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  } else if (query.startDate) {
    filter.createdAt = { $gte: new Date(query.startDate) };
  } else if (query.endDate) {
    filter.createdAt = { $lte: new Date(query.endDate) };
  }

  // Search across fullName, email, phone, leadId, leadSource, city
  if (query.search && query.search.trim() !== '') {
    const s = query.search.trim();
    filter.$or = [
      { fullName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { leadId: { $regex: s, $options: 'i' } },
      { leadSource: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { projectType: { $regex: s, $options: 'i' } },
    ];
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const sort = {};
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    sort[field] = order === 'desc' ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const total = await Lead.countDocuments(filter);
  const rawLeads = await Lead.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName avatar email')
    .lean();

  // Enrich each lead with their last follow-up and next follow-up
  const leadIds = rawLeads.map((l) => l._id);
  const now = new Date();

  const allFollowUps = await FollowUp.find({
    leadId: { $in: leadIds },
  })
    .sort({ scheduledAt: 1 })
    .lean();

  const leads = rawLeads.map((lead) => {
    const leadFollowUps = allFollowUps.filter((f) => String(f.leadId) === String(lead._id));

    // Next upcoming follow-up: pending follow-up scheduled in the future or today
    const upcoming = leadFollowUps.find((f) => f.status === 'pending' && new Date(f.scheduledAt) >= now);
    const nextFollowUp = upcoming || leadFollowUps.find((f) => f.status === 'pending');

    // Last follow-up: completed follow-up, or past follow-up
    const completedOrPast = leadFollowUps
      .filter((f) => f.status === 'completed' || new Date(f.scheduledAt) < now)
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
    const lastFollowUp = completedOrPast[0] || null;

    return {
      ...lead,
      lastFollowUp,
      nextFollowUp,
    };
  });

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
    .populate('assignedTo', 'firstName lastName avatar email phone')
    .populate('createdBy', 'firstName lastName avatar email')
    .populate('notesList.author', 'firstName lastName avatar');

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
    description: `Lead details updated for ${lead.fullName}`,
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
    description: `Lead ${lead.fullName} (${lead.leadId}) was deleted`,
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

/**
 * Convert Lead to Customer (Real conversion workflow)
 */
export const convertLeadToCustomer = async (leadId, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Check if customer already exists for this lead
  let customer = await Customer.findOne({ sourceLeadId: leadId });
  if (!customer) {
    customer = await convertService(leadId, createdBy);
  }

  // Update lead status to 'converted' or 'won'
  lead.status = 'converted';
  await lead.save();

  await logActivity({
    leadId: lead._id,
    customerId: customer._id,
    type: 'customer_created',
    description: `Lead ${lead.fullName} converted to customer ${customer.customerId || customer._id}`,
    performedBy: createdBy,
    metadata: { customerId: customer._id },
  });

  return { customer, lead };
};

/**
 * Add a note to a lead
 */
export const addLeadNote = async (leadId, content, author) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const note = {
    content,
    author,
    createdAt: new Date(),
  };

  lead.notesList.push(note);
  await lead.save();

  await logActivity({
    leadId: lead._id,
    type: 'note_added',
    description: `Note added: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
    performedBy: author,
  });

  return lead.populate('notesList.author', 'firstName lastName avatar');
};

/**
 * Bulk Assign Leads
 */
export const bulkAssignLeads = async (leadIds, assignedTo, performedBy) => {
  await Lead.updateMany(
    { _id: { $in: leadIds }, isDeleted: false },
    { $set: { assignedTo } }
  );

  for (const id of leadIds) {
    await logActivity({
      leadId: id,
      type: 'lead_reassigned',
      description: `Bulk assigned to staff ${assignedTo}`,
      performedBy,
    });
  }

  return true;
};

/**
 * Bulk Update Status
 */
export const bulkUpdateStatus = async (leadIds, status, performedBy) => {
  await Lead.updateMany(
    { _id: { $in: leadIds }, isDeleted: false },
    { $set: { status } }
  );

  for (const id of leadIds) {
    await logActivity({
      leadId: id,
      type: 'status_changed',
      description: `Status bulk updated to ${status}`,
      performedBy,
      metadata: { status },
    });
  }

  return true;
};

/**
 * Bulk Delete Leads
 */
export const bulkDeleteLeads = async (leadIds, performedBy) => {
  await Lead.updateMany(
    { _id: { $in: leadIds } },
    { $set: { isDeleted: true, deletedAt: new Date() } }
  );

  for (const id of leadIds) {
    await logActivity({
      leadId: id,
      type: 'lead_updated',
      description: `Bulk deleted`,
      performedBy,
    });
  }

  return true;
};

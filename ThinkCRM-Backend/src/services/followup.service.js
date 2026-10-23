import { FollowUp } from '../models/FollowUp.js';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

export const createFollowUp = async (leadId, data, createdBy, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Access check for staff
  if (user && !isOwnerOrAdmin && user._id) {
    const isAssigned = lead.assignedTo && lead.assignedTo.toString() === user._id.toString();
    const isCreator = lead.createdBy && lead.createdBy.toString() === user._id.toString();
    if (!isAssigned && !isCreator) {
      throw new AppError('Access denied: You cannot schedule follow-ups for this lead', 403);
    }
  }

  const followUp = await FollowUp.create({
    ...data,
    leadId,
    createdBy,
    assignedTo: (!isOwnerOrAdmin && user?._id) ? user._id : (data.assignedTo || lead.assignedTo || createdBy),
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

export const updateFollowUp = async (followUpId, data, updatedBy, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const followUp = await FollowUp.findById(followUpId).populate('leadId');
  if (!followUp) {
    throw new AppError('Follow-up not found', 404);
  }

  if (user && !isOwnerOrAdmin && user._id) {
    const isFollowUpOwner =
      (followUp.assignedTo && followUp.assignedTo.toString() === user._id.toString()) ||
      (followUp.createdBy && followUp.createdBy.toString() === user._id.toString());
    const isLeadOwner =
      followUp.leadId &&
      ((followUp.leadId.assignedTo && followUp.leadId.assignedTo.toString() === user._id.toString()) ||
       (followUp.leadId.createdBy && followUp.leadId.createdBy.toString() === user._id.toString()));

    if (!isFollowUpOwner && !isLeadOwner) {
      throw new AppError('Access denied: You cannot edit this follow-up', 403);
    }
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

export const getLeadFollowUps = async (leadId, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  if (user && !isOwnerOrAdmin && user._id) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new AppError('Lead not found', 404);
    const isAssigned = lead.assignedTo && lead.assignedTo.toString() === user._id.toString();
    const isCreator = lead.createdBy && lead.createdBy.toString() === user._id.toString();
    if (!isAssigned && !isCreator) {
      throw new AppError('Access denied', 403);
    }
  }

  const followUps = await FollowUp.find({ leadId })
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName avatar email');

  return followUps.sort((a, b) => {
    const isPendingA = a.status === 'pending';
    const isPendingB = b.status === 'pending';
    if (isPendingA && !isPendingB) return -1;
    if (!isPendingA && isPendingB) return 1;
    if (isPendingA && isPendingB) {
      return new Date(a.scheduledAt) - new Date(b.scheduledAt);
    }
    return new Date(b.scheduledAt) - new Date(a.scheduledAt);
  });
};

export const getAllFollowUps = async (user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const filter = {};
  if (user && !isOwnerOrAdmin && user._id) {
    const userLeads = await Lead.find({
      isDeleted: false,
      $or: [{ assignedTo: user._id }, { createdBy: user._id }],
    }).select('_id');
    const leadIds = userLeads.map((l) => l._id);
    filter.$or = [
      { assignedTo: user._id },
      { createdBy: user._id },
      { leadId: { $in: leadIds } },
    ];
  }

  return await FollowUp.find(filter)
    .sort({ scheduledAt: 1 })
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName avatar email')
    .populate('leadId', 'fullName company email phone status projectType leadId');
};

export const deleteFollowUp = async (followUpId, deletedBy, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const followUp = await FollowUp.findById(followUpId).populate('leadId');
  if (!followUp) {
    throw new AppError('Follow-up not found', 404);
  }

  if (user && !isOwnerOrAdmin && user._id) {
    const isFollowUpOwner =
      (followUp.assignedTo && followUp.assignedTo.toString() === user._id.toString()) ||
      (followUp.createdBy && followUp.createdBy.toString() === user._id.toString());
    const isLeadOwner =
      followUp.leadId &&
      ((followUp.leadId.assignedTo && followUp.leadId.assignedTo.toString() === user._id.toString()) ||
       (followUp.leadId.createdBy && followUp.leadId.createdBy.toString() === user._id.toString()));

    if (!isFollowUpOwner && !isLeadOwner) {
      throw new AppError('Access denied: You cannot delete this follow-up', 403);
    }
  }

  await FollowUp.findByIdAndDelete(followUpId);


  if (followUp.leadId) {
    const nextPending = await FollowUp.findOne({
      leadId: followUp.leadId,
      status: 'pending',
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 });

    await Lead.findByIdAndUpdate(followUp.leadId, {
      nextFollowUpAt: nextPending ? nextPending.scheduledAt : null,
    });

    await logActivity({
      leadId: followUp.leadId,
      type: 'status_changed',
      description: `Follow-up (${followUp.type}) was deleted`,
      performedBy: deletedBy,
      metadata: { followUpId },
    });
  }

  return true;
};

export const deleteAllLeadFollowUps = async (leadId, deletedBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const followUps = await FollowUp.find({ leadId });
  if (followUps.length === 0) return true;

  await FollowUp.deleteMany({ leadId });

  await Lead.findByIdAndUpdate(leadId, {
    nextFollowUpAt: null,
  });

  await logActivity({
    leadId,
    type: 'status_changed',
    description: `All follow-ups (${followUps.length}) were deleted`,
    performedBy: deletedBy,
  });

  return true;
};


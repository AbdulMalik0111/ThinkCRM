import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { Measurement } from '../models/Measurement.js';
import { Quotation } from '../models/Quotation.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { convertLeadToCustomer as convertService } from './customer.service.js';
import { uploadToCloudinary, deleteFromCloudinary, formatDocumentFileUrl } from '../utils/cloudinary.js';
import { normalizePhone, normalizeEmail } from '../utils/normalize.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';
import { sendEmail } from '../integrations/email/email.service.js';
import { logger } from '../utils/logger.js'

export const getLeadStats = async (user = null) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const baseFilter = { isDeleted: false };
  if (user && !isOwnerOrAdmin && user._id) {
    baseFilter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
  }

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
    Lead.countDocuments(baseFilter),
    Lead.countDocuments({ ...baseFilter, createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } }),
    Lead.countDocuments({ ...baseFilter, status: 'new' }),
    Lead.countDocuments({ ...baseFilter, status: 'new', createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } }),
    Lead.countDocuments({ ...baseFilter, status: { $in: ['contacted', 'attempted', 'in_progress', 'follow_up'] } }),
    Lead.countDocuments({ ...baseFilter, status: { $in: ['contacted', 'attempted', 'in_progress', 'follow_up'] }, createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } }),
    Lead.countDocuments({ ...baseFilter, status: 'qualified' }),
    Lead.countDocuments({ ...baseFilter, status: 'qualified', createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } }),
    Lead.countDocuments({ ...baseFilter, status: { $in: ['won', 'converted'] } }),
    Lead.countDocuments({ ...baseFilter, status: { $in: ['won', 'converted'] }, createdAt: { $lt: thirtyDaysAgo, $gte: sixtyDaysAgo } }),
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

export const createLead = async (leadData, createdBy, user = null) => {
  if (leadData.metaLeadId) {
    const existing = await Lead.findOne({ metaLeadId: leadData.metaLeadId });
    if (existing) {
      throw new AppError('Lead from this Meta webhook already exists', 400);
    }
  }

  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

  // Extract initial follow-up payload if provided
  const { nextFollowUpDate, nextFollowUpTime, nextFollowUpType, sendReminderNotification, ...leadFields } = leadData;

  // Strict role scoping: If staff creates a lead, it is automatically assigned to themselves
  const finalAssignedTo = (!isOwnerOrAdmin && (user?._id || createdBy))
    ? (user?._id || createdBy)
    : (leadFields.assignedTo || undefined);

  const lead = await Lead.create({
    ...leadFields,
    createdAt: new Date(),
    assignedTo: finalAssignedTo,
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

  // Auto-create / link Customer record so that any created lead is immediately searchable and visible in Customer tab
  try {
    const cust = await convertService(lead._id, createdBy, { preserveStatus: true });
    if (cust && !lead.customerId) {
      lead.customerId = cust._id;
      await lead.save();
    }
  } catch (custErr) {
    console.warn(`Auto-creating customer for new lead ${lead._id} failed:`, custErr.message);
  }

  return lead;
};

export const getLeads = async (query = {}, user = null) => {
  const andConditions = [{ isDeleted: { $ne: true } }];

  // Staff role scoping: non-owners and non-admins only see leads assigned to them or created by them
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  if (user && !isOwnerOrAdmin && user._id) {
    const userObjId = mongoose.Types.ObjectId.isValid(user._id)
      ? new mongoose.Types.ObjectId(user._id)
      : user._id;
    andConditions.push({
      $or: [
        { assignedTo: userObjId },
        { createdBy: userObjId },
      ],
    });
  } else if (query.assignedTo && query.assignedTo !== 'all' && query.assignedTo !== '') {
    if (query.assignedTo === 'unassigned') {
      andConditions.push({
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: null },
        ],
      });
    } else if (mongoose.Types.ObjectId.isValid(query.assignedTo)) {
      andConditions.push({ assignedTo: new mongoose.Types.ObjectId(query.assignedTo) });
    } else {
      andConditions.push({ assignedTo: query.assignedTo });
    }
  }

  // Status Filter
  if (query.status && query.status !== 'all' && query.status.trim() !== '') {
    andConditions.push({ status: query.status.trim() });
  }

  // Source Filter
  const source = query.source || query.leadSource;
  if (source && source !== 'all' && source.trim() !== '') {
    const cleanPattern = source.trim().replace(/_/g, '[\\s_]');
    andConditions.push({ leadSource: { $regex: new RegExp(`^${cleanPattern}$`, 'i') } });
  }

  // Project Type Filter
  if (query.projectType && query.projectType !== 'all' && query.projectType.trim() !== '') {
    andConditions.push({ projectType: query.projectType.trim() });
  }

  // Priority Filter
  if (query.priority && query.priority !== 'all' && query.priority.trim() !== '') {
    andConditions.push({ priority: query.priority.trim() });
  }

  // Date Range Filter (createdAt)
  if (query.startDate && query.endDate) {
    const end = new Date(query.endDate);
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
      end.setHours(23, 59, 59, 999);
    }
    andConditions.push({
      createdAt: {
        $gte: new Date(query.startDate),
        $lte: end,
      },
    });
  } else if (query.startDate) {
    andConditions.push({ createdAt: { $gte: new Date(query.startDate) } });
  } else if (query.endDate) {
    const end = new Date(query.endDate);
    if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
      end.setHours(23, 59, 59, 999);
    }
    andConditions.push({ createdAt: { $lte: end } });
  }

  // Search across fullName, email, phone, leadId, leadSource, city, projectType
  if (query.search && query.search.trim() !== '') {
    const s = query.search.trim();
    andConditions.push({
      $or: [
        { fullName: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { leadId: { $regex: s, $options: 'i' } },
        { leadSource: { $regex: s, $options: 'i' } },
        { city: { $regex: s, $options: 'i' } },
        { projectType: { $regex: s, $options: 'i' } },
      ],
    });
  }

  const filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const sort = {};
  if (query.sort) {
    const [field, order] = query.sort.split(':');
    sort[field] = order === 'desc' ? -1 : 1;
    if (field !== '_id') {
      sort._id = -1;
    }
  } else {
    sort.createdAt = -1;
    sort._id = -1;
  }

  const total = await Lead.countDocuments(filter);
  const rawLeads = await Lead.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName avatar email')
    .lean();

  // Enrich each lead with their last follow-up, next follow-up, measurement, and quotation status
  const leadIds = rawLeads.map((l) => l._id);
  const now = new Date();

  const [allFollowUps, allMeasurements, allQuotations] = await Promise.all([
    FollowUp.find({ leadId: { $in: leadIds } })
      .sort({ scheduledAt: 1 })
      .lean(),
    Measurement.find({ leadId: { $in: leadIds } })
      .sort({ createdAt: -1 })
      .lean(),
    Quotation.find({ leadId: { $in: leadIds } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

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

    // Measurement status resolution
    let measurementStatus = lead.measurementStatus;
    if (!measurementStatus || measurementStatus === 'not_done') {
      const leadMeas = allMeasurements.find((m) => String(m.leadId) === String(lead._id));
      if (leadMeas) {
        measurementStatus = leadMeas.status === 'completed' ? 'done' : leadMeas.status === 'scheduled' ? 'scheduled' : 'not_done';
      } else if (lead.status === 'measurement_completed') {
        measurementStatus = 'done';
      } else if (lead.status === 'measurement_scheduled') {
        measurementStatus = 'scheduled';
      } else {
        measurementStatus = 'not_done';
      }
    }

    // Quotation status resolution
    let quotationStatus = lead.quotationStatus;
    if (!quotationStatus) {
      const leadQuot = allQuotations.find((q) => String(q.leadId) === String(lead._id));
      if (leadQuot) {
        quotationStatus = leadQuot.status === 'accepted' ? 'approved' : leadQuot.status === 'sent' ? 'sent' : leadQuot.status === 'draft' ? 'draft' : 'pending';
      } else if (lead.status === 'quotation_sent') {
        quotationStatus = 'sent';
      } else if (lead.status === 'quotation_pending') {
        quotationStatus = 'pending';
      } else {
        quotationStatus = 'pending';
      }
    }

    return {
      ...lead,
      measurementStatus,
      quotationStatus,
      lastFollowUp,
      nextFollowUp,
    };
  });

  return {
    leads,
    total,
    totalPages: Math.ceil(total / limit),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getLeadById = async (leadId, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const query = { _id: leadId, isDeleted: { $ne: true } };
  if (user && !isOwnerOrAdmin && user._id) {
    const userObjId = mongoose.Types.ObjectId.isValid(user._id)
      ? new mongoose.Types.ObjectId(user._id)
      : user._id;
    query.$or = [{ assignedTo: userObjId }, { createdBy: userObjId }];
  }

  const lead = await Lead.findOne(query)
    .populate('assignedTo', 'firstName lastName avatar email phone')
    .populate('createdBy', 'firstName lastName avatar email')
    .populate('notesList.author', 'firstName lastName avatar');

  if (!lead) {
    throw new AppError('Lead not found or access denied', 404);
  }
  const leadObj = lead.toObject();
  leadObj.documents = (leadObj.documents || []).map(formatDocumentFileUrl);
  return leadObj;
};

export const updateLead = async (leadId, updateData, updatedBy, user = null) => {
  if (updateData?.data && typeof updateData.data === 'object' && !Array.isArray(updateData.data)) {
    updateData = updateData.data;
  }
  updateData = { ...updateData };

  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const query = { _id: leadId, isDeleted: { $ne: true } };
  if (user && !isOwnerOrAdmin && user._id) {
    const userObjId = mongoose.Types.ObjectId.isValid(user._id)
      ? new mongoose.Types.ObjectId(user._id)
      : user._id;
    query.$or = [{ assignedTo: userObjId }, { createdBy: userObjId }];
    // Non-admin staff cannot reassign leads to others
    delete updateData.assignedTo;
  }

  const lead = await Lead.findOne(query);
  if (!lead) {
    throw new AppError('Lead not found or access denied', 404);
  }

  // Normalize email
  if (typeof updateData.email === 'string') {
    updateData.email = updateData.email.trim().toLowerCase();
  }

  // Normalize phone
  if (typeof updateData.phone === 'string') {
    updateData.phone = updateData.phone.trim();
  }

  // Append note to notesList if provided
  if (updateData.notes && typeof updateData.notes === 'string' && updateData.notes.trim()) {
    lead.notes = updateData.notes.trim();
    if (!lead.notesList) lead.notesList = [];
    lead.notesList.push({
      content: updateData.notes.trim(),
      author: updatedBy || null,
      createdAt: new Date(),
    });
  }

  const oldStatus = lead.status;
  const oldPhone = lead.phone;
  const oldEmail = lead.email;

  Object.assign(lead, updateData);
  await lead.save();

  // Two-way sync: keep linked Customer updated if personal/contact info changed
  if (
    updateData.email ||
    updateData.phone ||
    updateData.alternatePhone ||
    updateData.fullName ||
    updateData.city ||
    updateData.state ||
    updateData.pincode ||
    updateData.address ||
    updateData.location
  ) {
    try {
      let targetCustomerId = lead.customerId;
      let linkedCust = null;

      if (targetCustomerId) {
        linkedCust = await Customer.findOne({ _id: targetCustomerId, deletedAt: null });
      }

      if (!linkedCust) {
        const searchConditions = [
          { sourceLeadId: lead._id },
          { leads: lead._id },
          { 'projects.leadId': lead._id },
          ...(oldPhone ? [{ phone: oldPhone }] : []),
          ...(lead.phone ? [{ phone: lead.phone }] : []),
          ...(oldEmail ? [{ email: oldEmail.toLowerCase() }] : []),
          ...(lead.email ? [{ email: lead.email.toLowerCase() }] : []),
        ];

        linkedCust = await Customer.findOne({
          deletedAt: null,
          $or: searchConditions,
        });

        if (linkedCust) {
          targetCustomerId = linkedCust._id;
          lead.customerId = linkedCust._id;
          await Lead.findByIdAndUpdate(lead._id, { customerId: linkedCust._id });
        }
      }

      if (targetCustomerId) {
        const custUpdates = {};
        if (updateData.email) custUpdates.email = updateData.email;
        if (updateData.phone) custUpdates.phone = updateData.phone;
        if (updateData.alternatePhone !== undefined) custUpdates.alternatePhone = updateData.alternatePhone;
        if (updateData.fullName) custUpdates.fullName = updateData.fullName;
        if (updateData.city !== undefined) custUpdates.city = updateData.city;
        if (updateData.state !== undefined) custUpdates.state = updateData.state;
        if (updateData.pincode !== undefined) custUpdates.pincode = updateData.pincode;
        if (updateData.address !== undefined) custUpdates.address = updateData.address;
        if (updateData.location !== undefined) custUpdates.location = updateData.location;

        if (!linkedCust?.sourceLeadId) {
          custUpdates.sourceLeadId = lead._id;
        }

        await Customer.findByIdAndUpdate(targetCustomerId, { $set: custUpdates });
      }
    } catch (custSyncErr) {
      console.warn('Customer sync during lead update failed:', custSyncErr.message);
    }
  }

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

    if (updateData.status === 'won' || updateData.status === 'converted') {
      try {
        if (!lead.customerId) {
          const cust = await convertService(lead._id, updatedBy);
          if (cust) {
            lead.customerId = cust._id;
            await lead.save();
          }
        }
      } catch (convErr) {
        console.warn('Auto-convert to customer failed during lead status change:', convErr.message);
      }
    }
  }

  if (updateData.measurementStatus) {
    try {
      await logActivity({
        leadId: lead._id,
        type: 'measurement_updated',
        description: `Measurement status updated to ${updateData.measurementStatus}`,
        performedBy: updatedBy,
        metadata: { measurementStatus: updateData.measurementStatus },
      });
    } catch (actErr) {
      console.warn('Activity log failed for measurement_updated:', actErr.message);
    }
  }

  if (updateData.quotationStatus) {
    try {
      await logActivity({
        leadId: lead._id,
        type: 'quotation_updated',
        description: `Quotation status updated to ${updateData.quotationStatus}`,
        performedBy: updatedBy,
        metadata: { quotationStatus: updateData.quotationStatus },
      });
    } catch (actErr) {
      console.warn('Activity log failed for quotation_updated:', actErr.message);
    }
  }

  return lead;
};

export const deleteLead = async (leadId, deletedBy, user = null) => {
  const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');
  const query = { _id: leadId, isDeleted: false };
  if (user && !isOwnerOrAdmin && user._id) {
    const userObjId = mongoose.Types.ObjectId.isValid(user._id)
      ? new mongoose.Types.ObjectId(user._id)
      : user._id;
    query.$or = [{ assignedTo: userObjId }, { createdBy: userObjId }];
  }

  const lead = await Lead.findOne(query);
  if (!lead) {
    throw new AppError('Lead not found or access denied', 404);
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
  const customer = await convertService(leadId, createdBy);
  const updatedLead = await Lead.findById(leadId);
  return { customer, lead: updatedLead };
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
    customerId: lead.customerId || undefined,
    type: 'note_added',
    description: `Note added: "${(content || '').trim()}"`,
    metadata: {
      content: (content || '').trim(),
    },
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

    if (status === 'won' || status === 'converted') {
      try {
        const lead = await Lead.findById(id);
        if (lead && !lead.customerId) {
          const cust = await convertService(id, performedBy);
          if (cust) {
            lead.customerId = cust._id;
            await lead.save();
          }
        }
      } catch (convErr) {
        console.warn(`Auto-convert to customer failed for lead ${id}:`, convErr.message);
      }
    }
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

/**
 * Send Email to Lead
 */
export const sendLeadEmail = async (leadId, emailOptions, userId) => {
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const recipientEmail = emailOptions.to || lead.email;
  if (!recipientEmail) {
    throw new AppError('Lead has no email address', 400);
  }

  try {
    const result = await sendEmail({
      to: recipientEmail,
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      subject: emailOptions.subject || 'Update from ThinkTive CRM',
      text: emailOptions.message || '',
      html: emailOptions.html || `<p>${(emailOptions.message || '').replace(/\n/g, '<br>')}</p>`,
      attachments: emailOptions.attachments || [],
    });

    await logActivity({
      leadId: lead._id,
      type: 'lead_email_sent',
      description: `Email sent to ${recipientEmail}: "${emailOptions.subject || 'Update'}"`,
      performedBy: userId,
      metadata: {
        recipient: recipientEmail,
        subject: emailOptions.subject,
        attachmentsCount: (emailOptions.attachments || []).length,
      },
    });

    return result;
  } catch (error) {
    logger.error(`[sendLeadEmail] Failed to deliver email to ${recipientEmail}:`, error);
    throw new AppError(`Failed to send email: ${error.message || 'SMTP delivery error'}`, 400);
  }
};

export const addLeadDocument = async (leadId, docData, file, userId) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  let finalUrl = '';
  let finalSize = 0;
  let finalFileType = '';
  let finalPublicId = '';

  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(file.buffer, 'thinkcrm/leads/documents', {
        resource_type: 'auto',
      });
      finalUrl = uploadResult.secure_url;
      finalSize = uploadResult.bytes || file.size;
      finalFileType = file.mimetype || uploadResult.format || path.extname(file.originalname).slice(1);
      finalPublicId = uploadResult.public_id;
    } catch (uploadErr) {
      console.error('Cloudinary lead document upload error:', uploadErr);
      throw new AppError(`Failed to upload document to Cloudinary: ${uploadErr.message}`, 500);
    }
  } else if (docData.url) {
    finalUrl = docData.url;
    finalSize = docData.size || 0;
    finalFileType = docData.fileType || docData.type || 'other';
  }

  if (!finalUrl) {
    throw new AppError('Document file or valid URL is required', 400);
  }

  const newDoc = {
    name: (docData.name || file?.originalname || 'Document').trim(),
    type: docData.type || docData.category || 'Other',
    url: finalUrl,
    size: finalSize,
    publicId: finalPublicId,
    uploadedBy: userId,
    uploadedAt: new Date(),
  };

  lead.documents.push(newDoc);
  await lead.save();

  await logActivity({
    leadId: lead._id,
    customerId: lead.customerId || undefined,
    type: 'file_uploaded',
    description: `Document uploaded for lead ${lead.fullName}: ${newDoc.name}`,
    performedBy: userId,
  });

  return lead.documents.map(formatDocumentFileUrl);
};

export const deleteLeadDocument = async (leadId, docId, userId) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const docIndex = lead.documents.findIndex((d) => d._id.toString() === docId.toString());
  if (docIndex === -1) {
    throw new AppError('Document not found', 404);
  }

  const doc = lead.documents[docIndex];

  // Delete from Cloudinary if public ID exists
  if (doc.publicId) {
    await deleteFromCloudinary(doc.publicId);
  }

  // Delete legacy local file if any existed
  if (doc.url && doc.url.includes('/uploads/documents/')) {
    try {
      const filename = path.basename(doc.url);
      const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to delete legacy local document file:', e.message);
    }
  }

  lead.documents.splice(docIndex, 1);
  await lead.save();

  await logActivity({
    leadId: lead._id,
    type: 'file_uploaded',
    description: `Document deleted from lead ${lead.fullName}: ${doc.name}`,
    performedBy: userId,
  });

  return lead.documents;
};

/**
 * Bulk import leads from CSV data
 * Handles validation, enum normalization, staff assignment resolution,
 * in-file and database duplicate detection, and customer link preservation.
 */
export const importLeads = async (leadsList, userId, duplicatePolicy = 'skip') => {
  if (!Array.isArray(leadsList) || leadsList.length === 0) {
    throw new AppError('No lead records provided for import', 400);
  }

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors = [];

  const seenPhones = new Set();
  const seenEmails = new Set();

  const mapProjectType = (pt) => {
    if (!pt) return 'Modular Kitchen';
    const s = String(pt).trim().toLowerCase();
    if (s.includes('modular') && s.includes('kitchen')) return 'Modular Kitchen';
    if (s.includes('kitchen')) return 'Modular Kitchen';
    if (s.includes('wardrobe') && s.includes('design')) return 'Wardrobe Design';
    if (s.includes('wardrobe')) return 'Wardrobe';
    if (s.includes('bedroom')) return 'Bedroom';
    if (s.includes('living')) return 'Living Room';
    if (s.includes('office') && s.includes('interior')) return 'Office Interior';
    if (s.includes('office')) return 'Office';
    if (s.includes('full home') && s.includes('interior')) return 'Full Home Interior';
    if (s.includes('full home') || s.includes('home')) return 'Full Home';
    if (s.includes('commercial')) return 'Commercial';
    return 'Other';
  };

  const mapLeadSource = (src) => {
    if (!src) return 'Website';
    const s = String(src).trim().toLowerCase();
    if (s.includes('meta') && s.includes('ad')) return 'Meta Ads';
    if (s.includes('meta')) return 'Meta Ads';
    if (s.includes('fb') || s.includes('facebook')) return 'Facebook';
    if (s.includes('insta')) return 'Instagram';
    if (s.includes('google') && s.includes('ad')) return 'Google Ads';
    if (s.includes('google')) return 'Google';
    if (s.includes('whatsapp')) return 'WhatsApp';
    if (s.includes('referral')) return 'Referral';
    if (s.includes('phone') || s.includes('call')) return 'Phone';
    if (s.includes('walk')) return 'Walk-in';
    if (s.includes('manual')) return 'Manual';
    if (s.includes('web')) return 'Website';
    return 'Website';
  };

  const mapStatus = (st) => {
    if (!st) return 'new';
    const s = String(st).trim().toLowerCase().replace(/[\s-]/g, '_');
    const validStatuses = [
      'new', 'attempted', 'contacted', 'qualified', 'follow_up', 'in_progress',
      'measurement_pending', 'measurement_scheduled', 'measurement_completed',
      'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'converted', 'lost', 'junk'
    ];
    if (validStatuses.includes(s)) return s;
    if (s === 'won' || s === 'converted') return 'converted';
    return 'new';
  };

  const mapPriority = (pr) => {
    if (!pr) return 'medium';
    const s = String(pr).trim().toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(s)) return s;
    return 'medium';
  };

  // Cache staff lookups for efficiency
  const staffCache = new Map();

  for (let i = 0; i < leadsList.length; i++) {
    const row = leadsList[i];
    const rowNum = i + 1;

    try {
      const fullName = (row.fullName || row['Full Name'] || row.name || row['Name'] || '').trim();
      const phone = String(row.phone || row['Phone'] || row['Phone Number'] || row['Mobile'] || '').trim();
      const alternatePhone = String(row.alternatePhone || row['Alternate Phone'] || row['Alt Phone'] || '').trim();
      const email = String(row.email || row['Email'] || '').trim().toLowerCase();

      // Required field validation
      if (!fullName) {
        failedCount++;
        errors.push({ row: rowNum, error: 'Full name is required' });
        continue;
      }
      if (!phone) {
        failedCount++;
        errors.push({ row: rowNum, error: 'Phone number is required' });
        continue;
      }

      // Phone validation using validator
      const phoneRes = validateAndNormalizePhone(phone, 'IN');
      if (!phoneRes.isValid) {
        failedCount++;
        errors.push({ row: rowNum, error: phoneRes.error || `Invalid phone number: ${phone}` });
        continue;
      }
      const phoneDigits = phoneRes.canonical;
      const formattedPhone = phoneRes.formatted;

      // Email format check if provided
      let emailNorm = undefined;
      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
          failedCount++;
          errors.push({ row: rowNum, error: `Invalid email address format: "${email}"` });
          continue;
        }
        emailNorm = cleanEmail;
      }

      // 1. In-File Duplicate Checking
      if (seenPhones.has(phoneDigits) || (emailNorm && seenEmails.has(emailNorm))) {
        skippedCount++;
        errors.push({ row: rowNum, error: `Duplicate record within the same file (Phone: ${phone})` });
        continue;
      }
      seenPhones.add(phoneDigits);
      if (emailNorm) seenEmails.add(emailNorm);

      // 2. Database Duplicate Checking
      const dupQuery = [];
      if (phoneDigits && phoneDigits.length >= 7) {
        const phoneRegexStr = phoneDigits.split('').join('\\D*');
        dupQuery.push({ phone: { $regex: phoneRegexStr } });
        dupQuery.push({ alternatePhone: { $regex: phoneRegexStr } });
      }
      if (emailNorm) {
        dupQuery.push({ email: emailNorm });
      }

      if (dupQuery.length > 0) {
        const existingLead = await Lead.findOne({
          isDeleted: false,
          $or: dupQuery,
        });

        if (existingLead) {
          if (duplicatePolicy === 'skip') {
            skippedCount++;
            continue;
          }
        }
      }

      // 3. Resolve Staff Assignment
      let assignedTo = null;
      const staffVal = String(row.assignedStaff || row['Assigned Staff'] || row['Assigned To'] || row.assignedTo || '').trim();
      if (staffVal) {
        if (staffCache.has(staffVal.toLowerCase())) {
          assignedTo = staffCache.get(staffVal.toLowerCase());
        } else if (mongoose.Types.ObjectId.isValid(staffVal)) {
          assignedTo = staffVal;
          staffCache.set(staffVal.toLowerCase(), assignedTo);
        } else {
          const staffUser = await User.findOne({
            $or: [
              { email: staffVal.toLowerCase() },
              {
                $expr: {
                  $regexMatch: {
                    input: { $concat: ['$firstName', ' ', '$lastName'] },
                    regex: staffVal,
                    options: 'i',
                  },
                },
              },
              { firstName: { $regex: staffVal, $options: 'i' } },
            ],
          });
          if (staffUser) {
            assignedTo = staffUser._id;
            staffCache.set(staffVal.toLowerCase(), assignedTo);
          }
        }
      }

      // 4. Map Enums & Fields
      const projectType = mapProjectType(row.projectType || row['Project Type'] || row.project || row['Project']);
      const leadSource = mapLeadSource(row.leadSource || row['Lead Source'] || row.source || row['Source']);
      const status = mapStatus(row.status || row['Status']);
      const priority = mapPriority(row.priority || row['Priority']);

      // Budget handling
      const rawBudget = row.budget ?? row['Budget'] ?? row.budgetRange ?? row['Budget Range'] ?? 0;
      let numericBudget = undefined;
      let budgetRange = undefined;
      if (typeof rawBudget === 'number' && !isNaN(rawBudget)) {
        numericBudget = rawBudget;
        budgetRange = rawBudget ? `₹${rawBudget.toLocaleString('en-IN')}` : undefined;
      } else if (typeof rawBudget === 'string') {
        const parsedNum = Number(rawBudget.replace(/[^0-9.]/g, ''));
        if (!isNaN(parsedNum) && parsedNum > 0) {
          numericBudget = parsedNum;
        }
        budgetRange = rawBudget.trim() || undefined;
      }

      const requirement = String(row.requirement || row['Requirement'] || row.projectDescription || row['Project Description'] || '').trim();
      const preferredTimeline = String(row.preferredTimeline || row['Preferred Timeline'] || row.timeline || row['Timeline'] || '').trim();
      const city = String(row.city || row['City'] || '').trim();
      const location = String(row.location || row['Location'] || city || '').trim();
      const address = String(row.address || row['Address'] || '').trim();
      const state = String(row.state || row['State'] || '').trim();
      const pincode = String(row.pincode || row['Pincode'] || '').trim();
      const notes = String(row.notes || row['Notes'] || '').trim();

      // 5. Existing Customer Linking (Preserve relationships without duplicate customer creation)
      let customerId = null;
      const potentialCustomerQueries = [];
      if (phoneDigits && phoneDigits.length >= 7) {
        const phoneRegexStr = phoneDigits.split('').join('\\D*');
        potentialCustomerQueries.push({ phone: { $regex: phoneRegexStr } });
        potentialCustomerQueries.push({ alternatePhone: { $regex: phoneRegexStr } });
      }
      if (emailNorm) {
        potentialCustomerQueries.push({ email: emailNorm });
      }

      if (potentialCustomerQueries.length > 0) {
        const matchedCustomer = await Customer.findOne({
          deletedAt: null,
          $or: potentialCustomerQueries,
        });
        if (matchedCustomer) {
          customerId = matchedCustomer._id;
        }
      }

      // 6. Create the Lead
      const newLead = await Lead.create({
        fullName,
        phone: formattedPhone,
        alternatePhone: alternatePhone || undefined,
        email: emailNorm || undefined,
        projectType,
        projectDescription: requirement || undefined,
        budget: numericBudget,
        budgetRange,
        preferredTimeline: preferredTimeline || undefined,
        leadSource,
        status,
        priority,
        city: city || undefined,
        location: location || undefined,
        address: address || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        notes: notes || undefined,
        notesList: notes ? [{ content: notes, author: userId, createdAt: new Date() }] : [],
        assignedTo: assignedTo || undefined,
        createdBy: userId,
        customerId: customerId || null,
      });

      // If customer exists, link this new lead into customer.leads array
      if (customerId) {
        await Customer.updateOne(
          { _id: customerId },
          { $addToSet: { leads: newLead._id } }
        );
      } else {
        // Auto-create Customer record so that any imported lead is immediately searchable and visible in Customer tab
        try {
          const cust = await convertService(newLead._id, userId, { preserveStatus: true });
          if (cust && !newLead.customerId) {
            newLead.customerId = cust._id;
            await newLead.save();
          }
        } catch (custErr) {
          console.warn(`Auto-creating customer for imported lead ${newLead._id} failed:`, custErr.message);
        }
      }

      // Log creation activity
      await logActivity({
        leadId: newLead._id,
        type: 'lead_created',
        description: `Lead imported via CSV: ${newLead.fullName} (${newLead.projectType})`,
        performedBy: userId,
      });

      importedCount++;
    } catch (rowErr) {
      failedCount++;
      errors.push({ row: rowNum, error: rowErr.message || 'Failed to import lead record' });
    }
  }

  return {
    imported: importedCount,
    skipped: skippedCount,
    failed: failedCount,
    errors,
  };
};


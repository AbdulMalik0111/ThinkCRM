import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Quotation } from '../models/Quotation.js';
import { FollowUp } from '../models/FollowUp.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../utils/AppError.js';
import { logActivity, getCustomerActivities } from './activity.service.js';
import { sendEmail } from '../integrations/email/email.service.js';
import { uploadToCloudinary, deleteFromCloudinary, formatDocumentFileUrl } from '../utils/cloudinary.js';
import { normalizePhone, normalizeEmail, nameSimilarity } from '../utils/normalize.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';
import { formatQuotationFileUrl } from './quotation.service.js';

/**
 * Converts a lead to a customer, or links it to an existing verified customer (Deduplication).
 * Idempotent: repeated calls safely return the linked customer record.
 */
export const convertLeadToCustomer = async (leadId, createdBy, options = {}) => {
  const { preserveStatus = false } = options;
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // 1. Idempotency Check: if lead already linked to a customer
  if (lead.customerId) {
    const existing = await Customer.findOne({ _id: lead.customerId, deletedAt: null });
    if (existing) {
      if (!preserveStatus && lead.status !== 'converted' && lead.status !== 'won' && lead.status !== 'qualified') {
        lead.status = 'converted';
        await lead.save();
      }
      return existing;
    }
  }

  // 2. Check if customer has sourceLeadId or leads array pointing to this lead
  const existingByLead = await Customer.findOne({
    deletedAt: null,
    $or: [{ sourceLeadId: lead._id }, { leads: lead._id }],
  });
  if (existingByLead) {
    lead.customerId = existingByLead._id;
    if (!preserveStatus && lead.status !== 'converted' && lead.status !== 'won' && lead.status !== 'qualified') {
      lead.status = 'converted';
    }
    await lead.save();
    return existingByLead;
  }

  // 3. Deduplication: Check if an existing verified customer matches this person
  const { canonical: leadPhoneDigits } = normalizePhone(lead.phone);
  const leadEmailNormalized = normalizeEmail(lead.email);

  const potentialQueries = [];
  if (leadPhoneDigits && leadPhoneDigits.length === 10) {
    potentialQueries.push({ phone: { $regex: leadPhoneDigits } });
    potentialQueries.push({ alternatePhone: { $regex: leadPhoneDigits } });
  }
  if (leadEmailNormalized) {
    potentialQueries.push({ email: leadEmailNormalized });
  }

  let matchedCustomer = null;
  if (potentialQueries.length > 0) {
    const candidates = await Customer.find({
      deletedAt: null,
      $or: potentialQueries,
    });

    for (const cand of candidates) {
      const { canonical: candPhoneDigits } = normalizePhone(cand.phone);
      const candEmailNormalized = normalizeEmail(cand.email);

      const phoneMatches = leadPhoneDigits && candPhoneDigits && leadPhoneDigits === candPhoneDigits;
      const emailMatches = leadEmailNormalized && candEmailNormalized && leadEmailNormalized === candEmailNormalized;
      const sim = nameSimilarity(lead.fullName, cand.fullName);

      // Verify identity signal:
      // A) Phone matches AND (email matches OR name is very similar >= 0.5)
      // B) Email matches AND (phone matches OR name is very similar >= 0.5)
      if ((phoneMatches && (emailMatches || sim >= 0.5)) || (emailMatches && (phoneMatches || sim >= 0.5))) {
        matchedCustomer = cand;
        break;
      }
    }
  }

  if (matchedCustomer) {
    // LINK TO EXISTING VERIFIED CUSTOMER
    lead.customerId = matchedCustomer._id;
    if (!preserveStatus && lead.status !== 'won' && lead.status !== 'qualified') {
      lead.status = 'converted';
    }
    await lead.save();

    // Ensure lead._id is in matchedCustomer.leads
    if (!matchedCustomer.leads) matchedCustomer.leads = [];
    if (!matchedCustomer.leads.some((lId) => lId.toString() === lead._id.toString())) {
      matchedCustomer.leads.push(lead._id);
    }

    // Add new project for this lead under customer if not already present
    const projectType = lead.projectType || 'Interior';
    const projectName = `${projectType} Project`;
    const hasProjectForLead = matchedCustomer.projects?.some(
      (p) => p.leadId && p.leadId.toString() === lead._id.toString()
    );

    if (!hasProjectForLead) {
      if (!matchedCustomer.projects) matchedCustomer.projects = [];
      matchedCustomer.projects.push({
        projectName,
        projectType,
        description: lead.projectDescription || '',
        budget: Number(lead.budget) || 0,
        status: 'active',
        assignedStaff: lead.assignedTo || matchedCustomer.assignedStaff || null,
        leadId: lead._id,
        startDate: new Date(),
      });
      matchedCustomer.totalValue = matchedCustomer.projects.reduce(
        (sum, p) => sum + (Number(p.budget) || 0),
        0
      );
    }

    await matchedCustomer.save();

    // Re-link existing quotations and followups on this lead to the customer
    await Quotation.updateMany({ leadId: lead._id }, { customerId: matchedCustomer._id });
    await FollowUp.updateMany({ leadId: lead._id }, { customerId: matchedCustomer._id });

    await logActivity({
      leadId: lead._id,
      customerId: matchedCustomer._id,
      type: 'lead_linked',
      description: `Lead "${lead.fullName} (${projectType})" linked to existing customer ${matchedCustomer.fullName} (${matchedCustomer.customerId})`,
      performedBy: createdBy,
      metadata: { customerId: matchedCustomer._id, leadId: lead._id },
    });

    return matchedCustomer;
  }

  // 4. CREATE NEW CUSTOMER RECORD
  const projects = [];
  if (lead.projectType) {
    projects.push({
      projectName: `${lead.projectType} Project`,
      projectType: lead.projectType,
      description: lead.projectDescription || '',
      budget: Number(lead.budget) || 0,
      status: 'active',
      assignedStaff: lead.assignedTo || null,
      leadId: lead._id,
      startDate: new Date(),
    });
  }

  const customer = await Customer.create({
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    location: lead.location,
    city: lead.city,
    state: lead.state,
    pincode: lead.pincode,
    source: lead.leadSource || 'Website',
    assignedStaff: lead.assignedTo || null,
    projectType: lead.projectType,
    totalValue: Number(lead.budget) || 0,
    projects,
    sourceLeadId: lead._id,
    leads: [lead._id],
  });

  lead.customerId = customer._id;
  if (!preserveStatus && lead.status !== 'won' && lead.status !== 'qualified') {
    lead.status = 'converted';
  }
  await lead.save();

  // Re-link existing quotations and followups on this lead
  await Quotation.updateMany({ leadId: lead._id }, { customerId: customer._id });
  await FollowUp.updateMany({ leadId: lead._id }, { customerId: customer._id });

  await logActivity({
    leadId: lead._id,
    customerId: customer._id,
    type: 'customer_created',
    description: `Lead converted to new customer: ${customer.customerId} (${customer.fullName})`,
    performedBy: createdBy,
    metadata: { customerId: customer._id, leadId: lead._id },
  });

  return customer;
};

export const createCustomer = async (data, createdBy) => {
  // If sourceLeadId is provided, run conversion/deduplication workflow
  if (data.sourceLeadId) {
    return await convertLeadToCustomer(data.sourceLeadId, createdBy);
  }

  // Check for duplicate customer by phone or email
  const { canonical: phoneDigits } = normalizePhone(data.phone);
  const emailNorm = normalizeEmail(data.email);

  if (phoneDigits && phoneDigits.length === 10) {
    const existing = await Customer.findOne({
      deletedAt: null,
      phone: { $regex: phoneDigits },
    });
    if (existing) {
      throw new AppError(
        `A customer with phone number ${data.phone} already exists (${existing.customerId}: ${existing.fullName})`,
        400
      );
    }
  }

  if (emailNorm) {
    const existingEmail = await Customer.findOne({
      deletedAt: null,
      email: emailNorm,
    });
    if (existingEmail) {
      throw new AppError(
        `A customer with email ${data.email} already exists (${existingEmail.customerId}: ${existingEmail.fullName})`,
        400
      );
    }
  }

  // Initial projects handling
  const projects = Array.isArray(data.projects) ? data.projects : [];
  if (projects.length === 0 && data.projectName && data.projectType) {
    projects.push({
      projectName: data.projectName,
      projectType: data.projectType,
      description: data.projectDescription || '',
      budget: Number(data.budget) || 0,
      status: data.projectStatus || 'active',
      startDate: data.startDate || new Date(),
      completionDate: data.completionDate || null,
      assignedStaff: data.assignedStaff || null,
    });
  }

  const totalValue = Number(data.totalValue) || projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

  const customer = await Customer.create({
    ...data,
    projects,
    totalValue,
  });

  await logActivity({
    customerId: customer._id,
    type: 'customer_created',
    description: `Customer created: ${customer.customerId} (${customer.fullName})`,
    performedBy: createdBy,
    metadata: { customerId: customer._id },
  });

  return customer;
};

export const getCustomers = async (query = {}) => {
  const filter = { deletedAt: null };

  // Search across multiple fields
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { fullName: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { alternatePhone: { $regex: s, $options: 'i' } },
      { customerId: { $regex: s, $options: 'i' } },
      { location: { $regex: s, $options: 'i' } },
      { city: { $regex: s, $options: 'i' } },
      { companyName: { $regex: s, $options: 'i' } },
      { projectType: { $regex: s, $options: 'i' } },
      { tags: { $regex: s, $options: 'i' } },
    ];
  }

  // Field-level filters
  if (query.status && query.status !== 'all') {
    filter.status = query.status;
  }
  if (query.projectType && query.projectType !== 'all') {
    filter.$or = [
      { projectType: { $regex: query.projectType, $options: 'i' } },
      { 'projects.projectType': { $regex: query.projectType, $options: 'i' } },
    ];
  }
  if (query.city && query.city !== 'all') {
    filter.$or = [
      { city: { $regex: query.city, $options: 'i' } },
      { location: { $regex: query.city, $options: 'i' } },
    ];
  }
  if (query.assignedStaff && query.assignedStaff !== 'all') {
    filter.assignedStaff = query.assignedStaff;
  }
  if (query.tag && query.tag !== 'all') {
    filter.tags = query.tag;
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = start;
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Customer.countDocuments(filter);
  const rawCustomers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('assignedStaff', 'firstName lastName avatar email')
    .populate('sourceLeadId', 'leadId projectType status budget');

  // Enhance each customer with real leadsCount, projectsCount, and lastActivity
  const customers = await Promise.all(
    rawCustomers.map(async (custDoc) => {
      const custObj = custDoc.toObject();

      // Find real count of leads associated with this customer
      const leadsCount = await Lead.countDocuments({
        isDeleted: false,
        $or: [
          { customerId: custDoc._id },
          { _id: custDoc.sourceLeadId?._id || custDoc.sourceLeadId },
          { _id: { $in: custDoc.leads || [] } },
        ],
      });

      // Find latest activity
      const latestActivity = await Activity.findOne({
        $or: [{ customerId: custDoc._id }, ...(custDoc.sourceLeadId ? [{ leadId: custDoc.sourceLeadId }] : [])],
      })
        .sort({ createdAt: -1 })
        .select('createdAt type description');

      return {
        ...custObj,
        leadsCount: Math.max(leadsCount, (custDoc.leads?.length || 0)),
        projectsCount: custDoc.projects?.length || 0,
        lastActivity: latestActivity ? latestActivity.createdAt : custDoc.updatedAt || custDoc.createdAt,
      };
    })
  );

  // Compute live summary metrics for the directory cards
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [totalCustomersCount, newThisMonthCount, allActiveCusts] = await Promise.all([
    Customer.countDocuments({ deletedAt: null }),
    Customer.countDocuments({ deletedAt: null, createdAt: { $gte: startOfMonth } }),
    Customer.find({ deletedAt: null }).select('projects totalValue status'),
  ]);

  let activeProjectsCount = 0;
  let completedProjectsCount = 0;
  let totalRevenueSum = 0;

  for (const c of allActiveCusts) {
    totalRevenueSum += c.totalValue || 0;
    if (c.projects && c.projects.length > 0) {
      for (const p of c.projects) {
        if (p.status === 'active' || p.status === 'in_progress') activeProjectsCount++;
        if (p.status === 'completed') completedProjectsCount++;
      }
    } else {
      if (c.status === 'active' || c.status === 'in_progress') activeProjectsCount++;
      if (c.status === 'completed') completedProjectsCount++;
    }
  }

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    metrics: {
      totalCustomers: totalCustomersCount,
      newThisMonth: newThisMonthCount,
      activeProjects: activeProjectsCount,
      completedProjects: completedProjectsCount,
      totalRevenue: totalRevenueSum,
    },
  };
};

export const getCustomerById = async (customerId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null })
    .populate('assignedStaff', 'firstName lastName avatar email phone')
    .populate('projects.assignedStaff', 'firstName lastName avatar email')
    .populate('notes.createdBy', 'firstName lastName avatar')
    .populate('documents.uploadedBy', 'firstName lastName avatar');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Retrieve ALL linked leads for this customer
  const leads = await Lead.find({
    isDeleted: false,
    $or: [
      { customerId: customer._id },
      ...(customer.sourceLeadId ? [{ _id: customer.sourceLeadId }] : []),
      ...(customer.leads && customer.leads.length > 0 ? [{ _id: { $in: customer.leads } }] : []),
    ],
  })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'firstName lastName avatar email');

  // Collect all distinct lead IDs
  const leadIds = [
    ...new Set(
      [
        customer.sourceLeadId?.toString(),
        ...(customer.leads || []).map((l) => l.toString()),
        ...leads.map((l) => l._id.toString()),
      ].filter(Boolean)
    ),
  ];

  // Retrieve all quotations (tied directly to customer or any linked lead)
  const quotationFilter = [{ customerId: customer._id }];
  if (leadIds.length > 0) quotationFilter.push({ leadId: { $in: leadIds } });
  if (customer.email) quotationFilter.push({ customerEmail: customer.email });

  const rawQuotations = await Quotation.find({ $or: quotationFilter })
    .sort({ createdAt: -1 })
    .populate('createdBy sentBy', 'firstName lastName avatar');

  // Deduplicate quotations by _id and attach lead info
  const quotationsMap = new Map();
  for (const q of rawQuotations) {
    const qObj = formatQuotationFileUrl(q);
    if (!quotationsMap.has(qObj._id.toString())) {
      const relatedLead = leads.find((l) => l._id.toString() === q.leadId?.toString());
      if (relatedLead) {
        qObj.leadInfo = {
          leadId: relatedLead.leadId,
          leadName: relatedLead.fullName,
          projectType: relatedLead.projectType,
          quotationStatus: relatedLead.quotationStatus,
          status: relatedLead.status,
        };
      }
      if (
        (qObj.status === 'draft' || !qObj.status) &&
        (qObj.sentAt || relatedLead?.quotationStatus === 'sent' || relatedLead?.status === 'quotation_sent')
      ) {
        qObj.status = 'sent';
      }
      quotationsMap.set(qObj._id.toString(), qObj);
    }
  }
  const quotations = Array.from(quotationsMap.values());

  // Retrieve all follow-ups (tied to customer or any linked lead)
  const followUpFilter = [{ customerId: customer._id }];
  if (leadIds.length > 0) followUpFilter.push({ leadId: { $in: leadIds } });

  const rawFollowUps = await FollowUp.find({ $or: followUpFilter })
    .sort({ scheduledAt: -1 })
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName');

  const followUpsMap = new Map();
  for (const f of rawFollowUps) {
    const fObj = f.toObject();
    if (!followUpsMap.has(fObj._id.toString())) {
      const relatedLead = leads.find((l) => l._id.toString() === f.leadId?.toString());
      if (relatedLead) {
        fObj.leadInfo = {
          leadId: relatedLead.leadId,
          leadName: relatedLead.fullName,
          projectType: relatedLead.projectType,
        };
      }
      followUpsMap.set(fObj._id.toString(), fObj);
    }
  }
  const followUps = Array.from(followUpsMap.values());

  // Unified Documents: customer documents + lead documents across all linked leads
  const unifiedDocsMap = new Map();
  if (customer.documents && customer.documents.length > 0) {
    for (const d of customer.documents) {
      const docObj = formatDocumentFileUrl(d.toObject ? d.toObject() : d);
      const key = docObj.publicId || docObj.url;
      if (key && !unifiedDocsMap.has(key)) {
        unifiedDocsMap.set(key, {
          ...docObj,
          sourceType: 'customer',
          sourceLabel: 'Customer Document',
        });
      }
    }
  }

  for (const leadItem of leads) {
    if (leadItem.documents && leadItem.documents.length > 0) {
      for (const d of leadItem.documents) {
        const docObj = formatDocumentFileUrl(d.toObject ? d.toObject() : d);
        const key = docObj.publicId || docObj.url;
        if (key && !unifiedDocsMap.has(key)) {
          unifiedDocsMap.set(key, {
            ...docObj,
            sourceType: 'lead',
            sourceLabel: `Lead: ${leadItem.projectType || leadItem.fullName}`,
            leadId: leadItem._id,
            leadNumber: leadItem.leadId,
            leadProjectType: leadItem.projectType,
          });
        }
      }
    }
  }
  const documents = Array.from(unifiedDocsMap.values());

  // Unified Notes: customer notes + lead notes across all linked leads
  const unifiedNotes = [];
  if (customer.notes && customer.notes.length > 0) {
    for (const n of customer.notes) {
      const noteObj = n.toObject ? n.toObject() : n;
      unifiedNotes.push({
        ...noteObj,
        sourceType: 'customer',
        sourceLabel: 'Customer Note',
      });
    }
  }

  for (const leadItem of leads) {
    if (leadItem.notesList && leadItem.notesList.length > 0) {
      for (const n of leadItem.notesList) {
        const noteObj = n.toObject ? n.toObject() : n;
        unifiedNotes.push({
          ...noteObj,
          sourceType: 'lead',
          sourceLabel: `Lead: ${leadItem.projectType || leadItem.fullName}`,
          leadId: leadItem._id,
          leadNumber: leadItem.leadId,
        });
      }
    }
  }
  unifiedNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Retrieve complete unified activities
  const activityQuery = [{ customerId: customer._id }];
  if (leadIds.length > 0) activityQuery.push({ leadId: { $in: leadIds } });

  const activities = await Activity.find({ $or: activityQuery })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'firstName lastName avatar email');

  return {
    customer,
    leads,
    quotations,
    followUps,
    documents,
    notes: unifiedNotes,
    activities,
  };
};

export const updateCustomer = async (customerId, updateData, userId) => {
  if (Array.isArray(updateData.projects)) {
    const sum = updateData.projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    if (sum > 0) updateData.totalValue = sum;
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    updateData,
    { new: true, runValidators: true }
  ).populate('assignedStaff', 'firstName lastName avatar email');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (userId) {
    await logActivity({
      customerId: customer._id,
      leadId: customer.sourceLeadId || undefined,
      type: 'customer_updated',
      description: `Customer information updated for ${customer.fullName}`,
      performedBy: userId,
      metadata: { updatedFields: Object.keys(updateData) },
    });
  }

  return customer;
};

export const deleteCustomer = async (customerId, userId) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  if (userId) {
    await logActivity({
      customerId: customer._id,
      leadId: customer.sourceLeadId || undefined,
      type: 'customer_deleted',
      description: `Customer archived: ${customer.fullName} (${customer.customerId})`,
      performedBy: userId,
    });
  }

  return { message: 'Customer archived successfully' };
};

export const addCustomerNote = async (customerId, { content, leadId }, userId) => {
  if (!content || !content.trim()) {
    throw new AppError('Note content is required', 400);
  }

  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // If a leadId was explicitly chosen, also add to that lead's notesList
  if (leadId) {
    const lead = await Lead.findById(leadId);
    if (lead) {
      lead.notesList.push({
        content: content.trim(),
        author: userId,
        createdAt: new Date(),
      });
      await lead.save();
    }
  }

  customer.notes.push({
    content: content.trim(),
    createdBy: userId,
    createdAt: new Date(),
  });
  await customer.save();

  await logActivity({
    customerId: customer._id,
    leadId: leadId || customer.sourceLeadId || undefined,
    type: 'customer_note_added',
    description: `Note added to customer ${customer.fullName}: "${content.trim()}"`,
    metadata: {
      content: content.trim(),
    },
    performedBy: userId,
  });

  return customer.notes;
};

export const updateCustomerNote = async (customerId, noteId, { content }, userId) => {
  if (!content || !content.trim()) {
    throw new AppError('Note content is required', 400);
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, 'notes._id': noteId, deletedAt: null },
    {
      $set: {
        'notes.$.content': content.trim(),
        'notes.$.updatedAt': new Date(),
      },
    },
    { new: true }
  ).populate('notes.createdBy', 'firstName lastName avatar');

  if (!customer) {
    throw new AppError('Customer or note not found', 404);
  }

  await logActivity({
    customerId: customer._id,
    type: 'customer_note_updated',
    description: `Note updated for customer ${customer.fullName}`,
    performedBy: userId,
  });

  return customer.notes;
};

export const deleteCustomerNote = async (customerId, noteId, userId) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    { $pull: { notes: { _id: noteId } } },
    { new: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await logActivity({
    customerId: customer._id,
    type: 'customer_note_deleted',
    description: `Note removed from customer ${customer.fullName}`,
    performedBy: userId,
  });

  return customer.notes;
};

export const addCustomerDocument = async (customerId, docData, userId) => {
  if (!docData.name && !docData.file) {
    throw new AppError('Document name or file is required', 400);
  }

  let finalUrl = docData.url;
  let finalSize = Number(docData.size) || 0;
  let finalFileType = docData.fileType || 'application/octet-stream';
  let finalPublicId = docData.publicId;

  if (docData.file && docData.file.buffer) {
    try {
      const uploadResult = await uploadToCloudinary(docData.file.buffer, 'thinkcrm/customer_documents');
      finalUrl = uploadResult.secure_url;
      finalSize = uploadResult.bytes || docData.file.size || finalSize;
      finalFileType = docData.file.mimetype || uploadResult.format || finalFileType;
      finalPublicId = uploadResult.public_id;
    } catch (uploadErr) {
      console.error('Cloudinary customer document upload error:', uploadErr);
      throw new AppError(`Failed to upload document to Cloudinary: ${uploadErr.message}`, 500);
    }
  }

  if (!finalUrl) {
    throw new AppError('Document file or valid URL is required', 400);
  }

  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const docName = (docData.name || docData.file?.originalname || 'Document').trim();

  const newDoc = {
    name: docName,
    category: docData.category || 'Other',
    url: finalUrl,
    size: finalSize,
    fileType: finalFileType,
    publicId: finalPublicId,
    leadId: docData.leadId || undefined,
    uploadedBy: userId,
    uploadedAt: new Date(),
  };

  customer.documents.push(newDoc);
  await customer.save();

  // If a leadId was chosen, also add this document to that lead
  if (docData.leadId) {
    const lead = await Lead.findById(docData.leadId);
    if (lead) {
      lead.documents.push({
        name: docName,
        url: finalUrl,
        size: finalSize,
        type: docData.category || 'Other',
        publicId: finalPublicId,
        uploadedBy: userId,
        uploadedAt: new Date(),
      });
      await lead.save();
    }
  }

  await logActivity({
    customerId: customer._id,
    leadId: docData.leadId || customer.sourceLeadId || undefined,
    type: 'customer_file_uploaded',
    description: `Document "${docName}" uploaded for customer ${customer.fullName}`,
    performedBy: userId,
  });

  return customer.documents;
};

export const deleteCustomerDocument = async (customerId, docId, userId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const docToDelete = customer.documents?.find((d) => d._id.toString() === docId.toString());
  if (docToDelete?.publicId) {
    await deleteFromCloudinary(docToDelete.publicId);
  }

  customer.documents = customer.documents.filter((d) => d._id.toString() !== docId.toString());
  await customer.save();

  await logActivity({
    customerId: customer._id,
    type: 'customer_file_deleted',
    description: `Document "${docToDelete?.name || 'File'}" deleted from customer ${customer.fullName}`,
    performedBy: userId,
  });

  return customer.documents;
};

export const addCustomerProject = async (customerId, projectData, userId) => {
  if (!projectData.projectName || !projectData.projectType) {
    throw new AppError('Project name and type are required', 400);
  }

  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const newProject = {
    projectName: projectData.projectName.trim(),
    projectType: projectData.projectType.trim(),
    description: projectData.description || '',
    budget: Number(projectData.budget) || 0,
    status: projectData.status || 'active',
    startDate: projectData.startDate || new Date(),
    completionDate: projectData.completionDate || null,
    assignedStaff: projectData.assignedStaff || customer.assignedStaff || userId,
    leadId: projectData.leadId || undefined,
    createdAt: new Date(),
  };

  customer.projects.push(newProject);
  customer.totalValue = customer.projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  await customer.save();

  await logActivity({
    customerId: customer._id,
    leadId: projectData.leadId || customer.sourceLeadId || undefined,
    type: 'project_created',
    description: `Project "${newProject.projectName}" created for customer ${customer.fullName} (Budget: ₹${newProject.budget.toLocaleString('en-IN')})`,
    performedBy: userId,
  });

  return customer.projects;
};

export const createCustomerFollowUp = async (customerId, data, createdBy) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const leadId = data.leadId || customer.sourceLeadId || undefined;

  const followUp = await FollowUp.create({
    ...data,
    customerId,
    leadId,
    createdBy,
    assignedTo: data.assignedTo || customer.assignedStaff || createdBy,
  });

  // If lead is linked, update lead's next follow up
  if (leadId && data.scheduledAt) {
    await Lead.findByIdAndUpdate(leadId, { nextFollowUpAt: data.scheduledAt });
  }

  await logActivity({
    customerId,
    leadId,
    type: 'follow_up_created',
    description: `Follow-up (${data.type}) scheduled for customer ${customer.fullName} on ${new Date(data.scheduledAt).toLocaleString()}`,
    performedBy: createdBy,
    metadata: { followUpId: followUp._id },
  });

  return followUp;
};

export const updateCustomerFollowUp = async (customerId, followUpId, data, userId) => {
  const followUp = await FollowUp.findOneAndUpdate(
    { _id: followUpId, customerId },
    data,
    { new: true }
  ).populate('assignedTo', 'firstName lastName avatar email');

  if (!followUp) {
    throw new AppError('Follow-up not found', 404);
  }

  const isCompleted = data.status === 'completed';
  await logActivity({
    customerId,
    leadId: followUp.leadId || undefined,
    type: isCompleted ? 'follow_up_completed' : 'follow_up_created',
    description: isCompleted
      ? `Follow-up marked completed for customer: ${data.outcome || 'Success'}`
      : `Follow-up updated/rescheduled for customer`,
    performedBy: userId,
    metadata: { followUpId },
  });

  return followUp;
};

export const deleteCustomerFollowUp = async (customerId, followUpId, userId) => {
  const followUp = await FollowUp.findOneAndDelete({ _id: followUpId, customerId });
  if (!followUp) {
    throw new AppError('Follow-up not found', 404);
  }

  await logActivity({
    customerId,
    leadId: followUp.leadId || undefined,
    type: 'follow_up_completed',
    description: `Follow-up cancelled for customer`,
    performedBy: userId,
    metadata: { followUpId },
  });

  return { message: 'Follow-up cancelled successfully' };
};

export const logCustomerCall = async (customerId, callData, userId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const leadId = callData.leadId || customer.sourceLeadId || undefined;
  const description = `Phone call with ${customer.fullName}: ${callData.outcome || 'Call completed'}. ${callData.notes || ''}`.trim();

  const activity = await logActivity({
    customerId: customer._id,
    leadId,
    type: 'customer_call_logged',
    description,
    performedBy: userId,
    metadata: {
      duration: callData.duration || 0,
      outcome: callData.outcome || 'connected',
      phone: customer.phone,
      notes: callData.notes,
    },
  });

  return activity;
};

export const logCustomerWhatsApp = async (customerId, waData, userId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const leadId = waData.leadId || customer.sourceLeadId || undefined;
  const description = `WhatsApp message initiated to ${customer.fullName} (${customer.phone}): "${(waData.message || '').trim()}"`;

  const activity = await logActivity({
    customerId: customer._id,
    leadId,
    type: 'customer_whatsapp_sent',
    description,
    performedBy: userId,
    metadata: {
      phone: customer.phone,
      message: waData.message,
      verified: true,
    },
  });

  return activity;
};

export const sendCustomerEmail = async (customerId, emailOptions, userId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const recipientEmail = emailOptions.to || customer.email;
  if (!recipientEmail) {
    throw new AppError('Customer has no email address', 400);
  }

  const result = await sendEmail({
    to: recipientEmail,
    cc: emailOptions.cc,
    bcc: emailOptions.bcc,
    subject: emailOptions.subject || 'Update from ThinkCRM',
    text: emailOptions.message || '',
    html: emailOptions.html || `<p>${(emailOptions.message || '').replace(/\n/g, '<br>')}</p>`,
    attachments: emailOptions.attachments || [],
  });

  await logActivity({
    customerId: customer._id,
    leadId: customer.sourceLeadId || undefined,
    type: 'customer_email_sent',
    description: `Email sent to ${recipientEmail}: "${emailOptions.subject || 'Update'}"`,
    performedBy: userId,
    metadata: {
      recipient: recipientEmail,
      subject: emailOptions.subject,
      attachmentsCount: (emailOptions.attachments || []).length,
    },
  });

  return result;
};

/**
 * Finds potential duplicate customer records in the system.
 */
export const getDuplicateCustomers = async () => {
  const activeCustomers = await Customer.find({ deletedAt: null }).select(
    'customerId fullName phone email createdAt totalValue projects'
  );

  const phoneMap = new Map();
  const emailMap = new Map();

  for (const c of activeCustomers) {
    const { canonical: p } = normalizePhone(c.phone);
    const e = normalizeEmail(c.email);

    if (p && p.length === 10) {
      if (!phoneMap.has(p)) phoneMap.set(p, []);
      phoneMap.get(p).push(c);
    }
    if (e) {
      if (!emailMap.has(e)) emailMap.set(e, []);
      emailMap.get(e).push(c);
    }
  }

  const duplicates = [];
  for (const [phone, list] of phoneMap.entries()) {
    if (list.length > 1) {
      duplicates.push({
        type: 'phone',
        key: phone,
        records: list,
      });
    }
  }

  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      // Avoid duplicate listing if already caught by phone
      const alreadyListed = duplicates.some(
        (d) => d.records.some((r) => list.some((l) => l._id.toString() === r._id.toString()))
      );
      if (!alreadyListed) {
        duplicates.push({
          type: 'email',
          key: email,
          records: list,
        });
      }
    }
  }

  return duplicates;
};

/**
 * Safely merges duplicate customer records into a primary customer.
 * Re-links all leads, projects, quotations, followups, documents, and notes to the primary customer.
 */
export const resolveDuplicateCustomers = async (primaryCustomerId, duplicateCustomerIds, userId) => {
  const primaryCustomer = await Customer.findOne({ _id: primaryCustomerId, deletedAt: null });
  if (!primaryCustomer) {
    throw new AppError('Primary customer not found', 404);
  }

  const duplicates = await Customer.find({
    _id: { $in: duplicateCustomerIds },
    deletedAt: null,
  });

  if (duplicates.length === 0) {
    throw new AppError('No duplicate customers found to merge', 400);
  }

  let totalProjectsMerged = 0;
  let totalDocsMerged = 0;
  let totalNotesMerged = 0;

  for (const dup of duplicates) {
    // 1. Re-link leads
    await Lead.updateMany({ customerId: dup._id }, { customerId: primaryCustomer._id });
    if (dup.sourceLeadId && !primaryCustomer.sourceLeadId) {
      primaryCustomer.sourceLeadId = dup.sourceLeadId;
    }
    if (dup.leads && dup.leads.length > 0) {
      for (const lId of dup.leads) {
        if (!primaryCustomer.leads.some((id) => id.toString() === lId.toString())) {
          primaryCustomer.leads.push(lId);
        }
      }
    }

    // 2. Re-link quotations & followups
    await Quotation.updateMany({ customerId: dup._id }, { customerId: primaryCustomer._id });
    await FollowUp.updateMany({ customerId: dup._id }, { customerId: primaryCustomer._id });
    await Activity.updateMany({ customerId: dup._id }, { customerId: primaryCustomer._id });

    // 3. Merge projects
    if (dup.projects && dup.projects.length > 0) {
      for (const p of dup.projects) {
        primaryCustomer.projects.push(p);
        totalProjectsMerged++;
      }
    }

    // 4. Merge documents
    if (dup.documents && dup.documents.length > 0) {
      for (const d of dup.documents) {
        primaryCustomer.documents.push(d);
        totalDocsMerged++;
      }
    }

    // 5. Merge notes
    if (dup.notes && dup.notes.length > 0) {
      for (const n of dup.notes) {
        primaryCustomer.notes.push(n);
        totalNotesMerged++;
      }
    }

    // Soft-delete duplicate customer record
    dup.deletedAt = new Date();
    await dup.save();
  }

  primaryCustomer.totalValue = primaryCustomer.projects.reduce(
    (sum, p) => sum + (Number(p.budget) || 0),
    0
  );
  await primaryCustomer.save();

  await logActivity({
    customerId: primaryCustomer._id,
    type: 'customer_merged',
    description: `Merged ${duplicates.length} duplicate customer record(s) into ${primaryCustomer.fullName} (${primaryCustomer.customerId})`,
    performedBy: userId,
    metadata: {
      mergedCustomerIds: duplicateCustomerIds,
      projectsMerged: totalProjectsMerged,
      documentsMerged: totalDocsMerged,
      notesMerged: totalNotesMerged,
    },
  });

  return {
    primaryCustomer,
    mergedCount: duplicates.length,
  };
};

export const importCustomers = async (customersList, userId) => {
  if (!Array.isArray(customersList) || customersList.length === 0) {
    throw new AppError('No customer records provided for import', 400);
  }

  let importedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (let i = 0; i < customersList.length; i++) {
    const row = customersList[i];
    try {
      const fullName = (row.fullName || row['Full Name'] || row.name || '').trim();
      const phone = (row.phone || row['Phone'] || row['Phone Number'] || '').trim();
      const email = (row.email || row['Email'] || '').trim().toLowerCase();

      if (!fullName) {
        failedCount++;
        errors.push({ row: i + 1, error: 'Full name is required' });
        continue;
      }
      if (!phone) {
        failedCount++;
        errors.push({ row: i + 1, error: 'Phone number is required' });
        continue;
      }

      // Phone validation using validator
      const phoneRes = validateAndNormalizePhone(phone, 'IN');
      if (!phoneRes.isValid) {
        failedCount++;
        errors.push({ row: i + 1, error: phoneRes.error || `Invalid phone number: ${phone}` });
        continue;
      }
      const phoneDigits = phoneRes.canonical;
      const formattedPhone = phoneRes.formatted;

      let emailNorm = undefined;
      if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
          failedCount++;
          errors.push({ row: i + 1, error: `Invalid email address format: "${email}"` });
          continue;
        }
        emailNorm = email;
      }

      const dupQuery = [];
      if (phoneDigits) dupQuery.push({ phone: { $regex: phoneDigits } });
      if (emailNorm) dupQuery.push({ email: emailNorm });

      const existing = await Customer.findOne({
        deletedAt: null,
        $or: dupQuery,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const projectType = (row.projectType || row['Project Type'] || 'Modular Kitchen').trim();
      const totalValue = Number(row.totalValue || row['Total Value'] || row.budget || 0) || 0;
      const status = (row.status || row['Status'] || 'active').toLowerCase().trim();
      const city = (row.city || row['City'] || '').trim();
      const location = (row.location || row['Location'] || city || '').trim();

      const newCustomer = await Customer.create({
        fullName,
        phone: formattedPhone,
        email: emailNorm || undefined,
        projectType,
        totalValue,
        status: ['active', 'in_progress', 'completed', 'on_hold'].includes(status) ? status : 'active',
        city,
        location,
        address: (row.address || row['Address'] || '').trim(),
        projects: projectType
          ? [
              {
                projectName: `${projectType} Project`,
                projectType,
                budget: totalValue,
                status: 'active',
                startDate: new Date(),
              },
            ]
          : [],
      });

      importedCount++;

      await logActivity({
        customerId: newCustomer._id,
        type: 'customer_created',
        description: `Customer imported: ${newCustomer.customerId} (${newCustomer.fullName})`,
        performedBy: userId,
      });
    } catch (err) {
      failedCount++;
      errors.push({ row: i + 1, error: err.message });
    }
  }

  return {
    imported: importedCount,
    skipped: skippedCount,
    failed: failedCount,
    total: customersList.length,
    errors,
  };
};

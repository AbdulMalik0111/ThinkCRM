import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Quotation } from '../models/Quotation.js';
import { FollowUp } from '../models/FollowUp.js';
import { AppError } from '../utils/AppError.js';
import { logActivity, getCustomerActivities } from './activity.service.js';
import { sendEmail } from './email.service.js';

export const convertLeadToCustomer = async (leadId, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Prevent duplicate customers for the same lead
  const existingCustomer = await Customer.findOne({ sourceLeadId: leadId });
  if (existingCustomer) {
    return existingCustomer;
  }

  // Build initial project if lead has project info
  const projects = [];
  if (lead.projectType) {
    projects.push({
      projectName: `${lead.projectType.charAt(0).toUpperCase() + lead.projectType.slice(1)} Project`,
      projectType: lead.projectType,
      description: lead.projectDescription || '',
      budget: lead.budget || 0,
      status: 'active',
      assignedStaff: lead.assignedTo || null,
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
    source: lead.leadSource || 'Website',
    assignedStaff: lead.assignedTo || null,
    projectType: lead.projectType,
    totalValue: lead.budget || 0,
    projects,
    sourceLeadId: lead._id,
  });

  await logActivity({
    leadId: lead._id,
    customerId: customer._id,
    type: 'customer_created',
    description: `Lead converted to customer: ${customer.customerId} (${customer.fullName})`,
    performedBy: createdBy,
    metadata: { customerId: customer._id },
  });

  return customer;
};

export const createCustomer = async (data, createdBy) => {
  // If sourceLeadId is provided, check for existing customer
  if (data.sourceLeadId) {
    const existing = await Customer.findOne({ sourceLeadId: data.sourceLeadId });
    if (existing) {
      throw new AppError('A customer is already linked to this lead', 400);
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
    leadId: customer.sourceLeadId || undefined,
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
  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('assignedStaff', 'firstName lastName avatar email')
    .populate('sourceLeadId', 'leadId projectType status budget');

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
    .populate('sourceLeadId')
    .populate('assignedStaff', 'firstName lastName avatar email phone')
    .populate('projects.assignedStaff', 'firstName lastName avatar email')
    .populate('notes.createdBy', 'firstName lastName avatar')
    .populate('documents.uploadedBy', 'firstName lastName avatar');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Fetch related quotations, follow-ups, and activities
  const leadId = customer.sourceLeadId?._id;

  const quotationFilter = [];
  if (leadId) quotationFilter.push({ leadId });
  if (customer.email) quotationFilter.push({ customerEmail: customer.email });
  if (customer.fullName) quotationFilter.push({ customerName: { $regex: customer.fullName, $options: 'i' } });

  const quotations = quotationFilter.length > 0
    ? await Quotation.find({ $or: quotationFilter }).sort({ createdAt: -1 })
    : [];

  const followUpFilter = [{ customerId: customer._id }];
  if (leadId) followUpFilter.push({ leadId });

  const followUps = await FollowUp.find({ $or: followUpFilter })
    .sort({ scheduledAt: -1 })
    .populate('assignedTo', 'firstName lastName avatar email')
    .populate('createdBy', 'firstName lastName');

  const activities = await getCustomerActivities(customer._id, leadId);

  return {
    customer,
    quotations,
    followUps,
    activities,
  };
};

export const updateCustomer = async (customerId, updateData, userId) => {
  // If projects updated, recalculate totalValue
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
      description: `Customer archived/deleted: ${customer.fullName} (${customer.customerId})`,
      performedBy: userId,
    });
  }

  return { message: 'Customer archived successfully' };
};

export const addCustomerNote = async (customerId, { content }, userId) => {
  if (!content || !content.trim()) {
    throw new AppError('Note content is required', 400);
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    {
      $push: {
        notes: {
          content: content.trim(),
          createdBy: userId,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate('notes.createdBy', 'firstName lastName avatar');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await logActivity({
    customerId: customer._id,
    leadId: customer.sourceLeadId || undefined,
    type: 'customer_note_added',
    description: `Note added to customer ${customer.fullName}`,
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

  return customer.notes;
};

export const addCustomerDocument = async (customerId, docData, userId) => {
  if (!docData.name || !docData.url) {
    throw new AppError('Document name and URL are required', 400);
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    {
      $push: {
        documents: {
          ...docData,
          uploadedBy: userId,
          uploadedAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate('documents.uploadedBy', 'firstName lastName avatar');

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  await logActivity({
    customerId: customer._id,
    leadId: customer.sourceLeadId || undefined,
    type: 'customer_file_uploaded',
    description: `Document uploaded for customer ${customer.fullName}: ${docData.name}`,
    performedBy: userId,
  });

  return customer.documents;
};

export const deleteCustomerDocument = async (customerId, docId, userId) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, deletedAt: null },
    { $pull: { documents: { _id: docId } } },
    { new: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

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

  customer.projects.push({
    ...projectData,
    createdAt: new Date(),
  });

  const sum = customer.projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  customer.totalValue = sum;

  await customer.save();

  await logActivity({
    customerId: customer._id,
    leadId: customer.sourceLeadId || undefined,
    type: 'project_created',
    description: `Project "${projectData.projectName}" created for customer ${customer.fullName}`,
    performedBy: userId,
  });

  return customer.projects;
};

export const createCustomerFollowUp = async (customerId, data, createdBy) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  const followUp = await FollowUp.create({
    ...data,
    customerId,
    leadId: customer.sourceLeadId || undefined,
    createdBy,
    assignedTo: data.assignedTo || customer.assignedStaff || createdBy,
  });

  await logActivity({
    customerId,
    leadId: customer.sourceLeadId || undefined,
    type: 'follow_up_created',
    description: `Follow-up (${data.type}) scheduled for customer ${customer.fullName} on ${new Date(data.scheduledAt).toLocaleDateString()}`,
    performedBy: createdBy,
    metadata: { followUpId: followUp._id },
  });

  return followUp;
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

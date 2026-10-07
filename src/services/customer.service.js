import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';

export const convertLeadToCustomer = async (leadId, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  if (lead.status !== 'won') {
    throw new AppError('Only leads with status "won" can be converted to customers', 400);
  }

  const existingCustomer = await Customer.findOne({ sourceLeadId: leadId });
  if (existingCustomer) {
    throw new AppError('Customer already exists for this lead', 400);
  }

  const customer = await Customer.create({
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    location: lead.location,
    sourceLeadId: lead._id,
  });

  await logActivity({
    leadId: lead._id,
    type: 'lead_updated',
    description: `Lead converted to customer: ${customer.customerId}`,
    performedBy: createdBy,
    metadata: { customerId: customer._id },
  });

  return customer;
};

export const getCustomers = async (query = {}) => {
  const filter = {};
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

  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sourceLeadId', 'leadId projectType');

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId).populate('sourceLeadId');
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

export const updateCustomer = async (customerId, updateData) => {
  const customer = await Customer.findByIdAndUpdate(customerId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

import fs from 'fs';
import path from 'path';
import { Quotation } from '../models/Quotation.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../integrations/email/email.service.js';

export const createQuotation = async (leadId, data, file, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  let uploadedFile = null;
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(file.buffer, 'thinkcrm/quotations', {
        resource_type: 'auto',
      });
      uploadedFile = {
        fileName: file.originalname,
        url: uploadResult.secure_url,
        mimeType: file.mimetype || uploadResult.format || 'application/pdf',
        storageKey: uploadResult.public_id,
      };
    } catch (uploadError) {
      console.error('Cloudinary quotation upload error:', uploadError);
      throw new AppError(`Failed to upload quotation to Cloudinary: ${uploadError?.message}`, 500);
    }
  }

  const rawAmount = data.amount !== undefined ? data.amount : (data.totalAmount !== undefined ? data.totalAmount : 0);
  const amount = Number(rawAmount) || 0;
  const customerName = data.customerName || lead.fullName || 'Valued Customer';
  const customerEmail = data.customerEmail || lead.email || '';
  const quotationNumber = data.quotationNumber || `QT-${Date.now().toString().slice(-6)}`;
  const message = data.message || data.notes || '';
  const customerId = lead.customerId || data.customerId || null;

  const quotation = await Quotation.create({
    ...data,
    customerName,
    customerEmail,
    quotationNumber,
    amount,
    message,
    leadId,
    customerId,
    uploadedFile,
    createdBy,
  });

  lead.status = 'quotation_pending';
  lead.quotationStatus = 'pending';
  await lead.save();

  await logActivity({
    leadId,
    customerId: customerId || undefined,
    type: 'quotation_uploaded',
    description: `Quotation ${quotation.quotationNumber} uploaded for amount ${amount}`,
    performedBy: createdBy,
    metadata: { quotationId: quotation._id },
  });

  return quotation;
};

export const createCustomerQuotation = async (customerId, data, file, createdBy) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  let uploadedFile = null;
  if (file) {
    try {
      const uploadResult = await uploadToCloudinary(file.buffer, 'thinkcrm/quotations', {
        resource_type: 'auto',
      });
      uploadedFile = {
        fileName: file.originalname,
        url: uploadResult.secure_url,
        mimeType: file.mimetype || uploadResult.format || 'application/pdf',
        storageKey: uploadResult.public_id,
      };
    } catch (uploadError) {
      console.error('Cloudinary customer quotation upload error:', uploadError);
      throw new AppError(`Failed to upload quotation to Cloudinary: ${uploadError?.message}`, 500);
    }
  }

  let leadId = data.leadId || null;
  if (leadId) {
    const lead = await Lead.findById(leadId);
    if (lead) {
      lead.status = 'quotation_pending';
      lead.quotationStatus = 'pending';
      if (!lead.customerId) {
        lead.customerId = customer._id;
      }
      await lead.save();
    }
  } else if (customer.sourceLeadId) {
    leadId = customer.sourceLeadId;
  }

  const rawAmount = data.amount !== undefined ? data.amount : (data.totalAmount !== undefined ? data.totalAmount : 0);
  const amount = Number(rawAmount) || 0;
  const customerName = data.customerName || customer.fullName || 'Valued Customer';
  const customerEmail = data.customerEmail || customer.email || '';
  const quotationNumber = data.quotationNumber || `QT-${Date.now().toString().slice(-6)}`;
  const message = data.message || data.notes || '';

  const quotation = await Quotation.create({
    ...data,
    customerName,
    customerEmail,
    quotationNumber,
    amount,
    message,
    customerId: customer._id,
    leadId: leadId || undefined,
    uploadedFile,
    createdBy,
  });

  await logActivity({
    customerId: customer._id,
    leadId: leadId || undefined,
    type: 'quotation_uploaded',
    description: `Quotation ${quotation.quotationNumber} uploaded for customer ${customer.fullName} (Amount: ₹${amount.toLocaleString('en-IN')})`,
    performedBy: createdBy,
    metadata: { quotationId: quotation._id },
  });

  return quotation;
};

export const sendQuotation = async (leadOrCustomerId, quotationId, sentBy) => {
  const quotation = await Quotation.findById(quotationId);
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  let lead = null;
  if (quotation.leadId) {
    lead = await Lead.findById(quotation.leadId);
  }

  let customer = null;
  if (quotation.customerId) {
    customer = await Customer.findOne({ _id: quotation.customerId, deletedAt: null });
  }

  if (!quotation.customerEmail) {
    quotation.customerEmail = customer?.email || lead?.email || '';
    if (quotation.customerEmail) await quotation.save();
  }

  if (!quotation.customerName) {
    quotation.customerName = customer?.fullName || lead?.fullName || 'Customer';
    if (quotation.customerName) await quotation.save();
  }

  if (!quotation.customerEmail) {
    throw new AppError('Customer email is required to send quotation', 400);
  }

  // Send Email
  const html = `
    <p>Dear ${quotation.customerName || 'Customer'},</p>
    <p>${quotation.message || 'Please find attached the quotation for your project.'}</p>
    <br/>
    <p>Best regards,</p>
    <p>ThinkCRM Team</p>
  `;

  try {
    await sendEmail({
      to: quotation.customerEmail,
      subject: `Your Quotation — ${quotation.quotationNumber}`,
      html,
      attachments: quotation.uploadedFile?.url
        ? [
            {
              filename: quotation.uploadedFile.fileName || `Quotation-${quotation.quotationNumber}.pdf`,
              path: quotation.uploadedFile.url,
            },
          ]
        : [],
    });
  } catch (emailErr) {
    console.warn('[QuotationService] SMTP warning:', emailErr?.message || emailErr);
  }

  quotation.status = 'sent';
  quotation.sentAt = Date.now();
  quotation.sentBy = sentBy;
  await quotation.save();

  if (lead) {
    lead.status = 'quotation_sent';
    lead.quotationStatus = 'sent';
    await lead.save();

    await logActivity({
      leadId: lead._id,
      customerId: quotation.customerId || customer?._id || undefined,
      type: 'quotation_sent',
      description: `Quotation ${quotation.quotationNumber} was sent to ${quotation.customerEmail}`,
      performedBy: sentBy,
      metadata: { quotationId: quotation._id },
    });

    if (lead.assignedTo && lead.assignedTo.toString() !== sentBy.toString()) {
      await createNotification({
        recipient: lead.assignedTo,
        type: 'quotation_sent',
        title: 'Quotation Sent',
        message: `Quotation ${quotation.quotationNumber} has been sent to customer for lead ${lead.fullName}.`,
        entityType: 'Quotation',
        entityId: quotation._id,
      });
    }
  } else if (customer) {
    await logActivity({
      customerId: customer._id,
      type: 'quotation_sent',
      description: `Quotation ${quotation.quotationNumber} was sent to ${quotation.customerEmail}`,
      performedBy: sentBy,
      metadata: { quotationId: quotation._id },
    });
  }

  return quotation;
};

export const getLeadQuotations = async (leadId) => {
  return await Quotation.find({ leadId }).sort({ createdAt: -1 }).populate('createdBy sentBy', 'firstName lastName');
};

export const getCustomerQuotations = async (customerId) => {
  const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  // Find linked leads
  const linkedLeads = await Lead.find({
    $or: [{ customerId: customer._id }, { _id: customer.sourceLeadId }, { _id: { $in: customer.leads || [] } }],
  }).select('_id');
  const leadIds = linkedLeads.map((l) => l._id);

  const queryOr = [{ customerId: customer._id }];
  if (leadIds.length > 0) queryOr.push({ leadId: { $in: leadIds } });
  if (customer.email) queryOr.push({ customerEmail: customer.email });

  return await Quotation.find({ $or: queryOr })
    .sort({ createdAt: -1 })
    .populate('createdBy sentBy', 'firstName lastName avatar')
    .populate('leadId', 'leadId fullName projectType status');
};

export const deleteQuotation = async (leadOrCustomerId, quotationId, deletedBy) => {
  const quotation = await Quotation.findById(quotationId);
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  // Delete from Cloudinary if public ID / storageKey exists
  if (quotation.uploadedFile?.storageKey) {
    await deleteFromCloudinary(quotation.uploadedFile.storageKey);
  }

  // Delete legacy local file if it exists
  if (quotation.uploadedFile?.url?.includes('/uploads/quotations/')) {
    try {
      const filename = path.basename(quotation.uploadedFile.url);
      const filePath = path.join(process.cwd(), 'uploads', 'quotations', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to delete legacy local quotation file:', e.message);
    }
  }

  const leadId = quotation.leadId;
  const customerId = quotation.customerId;

  await Quotation.deleteOne({ _id: quotationId });

  // Update lead status if no remaining quotations exist
  if (leadId) {
    const remainingQuotations = await Quotation.find({ leadId });
    if (remainingQuotations.length === 0) {
      const lead = await Lead.findById(leadId);
      if (lead) {
        lead.quotationStatus = 'pending';
        if (lead.status === 'quotation_sent' || lead.status === 'quotation_pending') {
          lead.status = 'follow_up';
        }
        await lead.save();
      }
    }
  }

  await logActivity({
    leadId: leadId || undefined,
    customerId: customerId || undefined,
    type: 'quotation_updated',
    description: `Quotation ${quotation.quotationNumber} was deleted`,
    performedBy: deletedBy,
    metadata: { quotationId },
  });

  return { message: 'Quotation deleted successfully' };
};

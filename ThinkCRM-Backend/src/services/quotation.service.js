import { Quotation } from '../models/Quotation.js';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../integrations/email/email.service.js';

export const createQuotation = async (leadId, data, file, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  let uploadedFile = null;
  if (file) {
    const result = await uploadToCloudinary(file.buffer, 'quotations');
    uploadedFile = {
      fileName: file.originalname,
      url: result.secure_url,
      mimeType: file.mimetype,
      storageKey: result.public_id,
    };
  }

  const amount = Number(data.amount);

  const quotation = await Quotation.create({
    ...data,
    amount,
    leadId,
    uploadedFile,
    createdBy,
  });

  lead.status = 'quotation_pending';
  await lead.save();

  await logActivity({
    leadId,
    type: 'quotation_uploaded',
    description: `Quotation ${quotation.quotationNumber} uploaded for amount ${amount}`,
    performedBy: createdBy,
    metadata: { quotationId: quotation._id },
  });

  return quotation;
};

export const sendQuotation = async (leadId, quotationId, sentBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const quotation = await Quotation.findOne({ _id: quotationId, leadId });
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  if (!quotation.customerEmail) {
    throw new AppError('Customer email is required to send quotation', 400);
  }

  if (!quotation.uploadedFile || !quotation.uploadedFile.url) {
    throw new AppError('Quotation PDF is required to send email', 400);
  }

  // Send Email
  const html = `
    <p>Dear ${quotation.customerName},</p>
    <p>${quotation.message || 'Please find attached the quotation for your project.'}</p>
    <br/>
    <p>Best regards,</p>
    <p>ThinkCRM Team</p>
  `;

  await sendEmail({
    to: quotation.customerEmail,
    subject: `Your Quotation — ${quotation.quotationNumber}`,
    html,
    attachments: [
      {
        filename: quotation.uploadedFile.fileName,
        path: quotation.uploadedFile.url,
      },
    ],
  });

  quotation.status = 'sent';
  quotation.sentAt = Date.now();
  quotation.sentBy = sentBy;
  await quotation.save();

  lead.status = 'quotation_sent';
  await lead.save();

  await logActivity({
    leadId,
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
      message: `Quotation ${quotation.quotationNumber} has been sent to the customer for lead ${lead.fullName}.`,
      entityType: 'Quotation',
      entityId: quotation._id,
    });
  }

  return quotation;
};

export const getLeadQuotations = async (leadId) => {
  return await Quotation.find({ leadId }).sort({ createdAt: -1 }).populate('createdBy sentBy', 'firstName lastName');
};

import fs from 'fs';
import path from 'path';
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
    // 1. Always save the actual uploaded file locally so it's guaranteed accessible as real PDF/doc
    const uploadsDir = path.join(process.cwd(), 'uploads', 'quotations');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeFileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const localFilePath = path.join(uploadsDir, safeFileName);
    fs.writeFileSync(localFilePath, file.buffer);
    const localUrl = `/uploads/quotations/${safeFileName}`;

    uploadedFile = {
      fileName: file.originalname,
      url: localUrl,
      mimeType: file.mimetype || 'application/pdf',
      storageKey: safeFileName,
    };

    // 2. Also attempt Cloudinary if configured
    try {
      const result = await uploadToCloudinary(file.buffer, 'quotations');
      if (result && result.secure_url) {
        uploadedFile.url = result.secure_url;
        uploadedFile.storageKey = result.public_id;
      }
    } catch (uploadError) {
      console.warn('Cloudinary upload warning (using local file):', uploadError?.message);
    }
  }

  const rawAmount = data.amount !== undefined ? data.amount : (data.totalAmount !== undefined ? data.totalAmount : 0);
  const amount = Number(rawAmount) || 0;
  const customerName = data.customerName || lead.fullName || 'Valued Customer';
  const customerEmail = data.customerEmail || lead.email || '';
  const quotationNumber = data.quotationNumber || `QT-${Date.now().toString().slice(-6)}`;
  const message = data.message || data.notes || '';

  const quotation = await Quotation.create({
    ...data,
    customerName,
    customerEmail,
    quotationNumber,
    amount,
    message,
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

  if (!quotation.customerEmail && lead.email) {
    quotation.customerEmail = lead.email;
    await quotation.save();
  }

  if (!quotation.customerName && lead.fullName) {
    quotation.customerName = lead.fullName;
    await quotation.save();
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

  lead.status = 'quotation_sent';
  lead.quotationStatus = 'sent';
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

export const deleteQuotation = async (leadId, quotationId, deletedBy) => {
  const quotation = await Quotation.findOne({ _id: quotationId, leadId });
  if (!quotation) {
    throw new AppError('Quotation not found', 404);
  }

  // Delete local file if it exists
  if (quotation.uploadedFile?.url?.includes('/uploads/quotations/')) {
    try {
      const filename = path.basename(quotation.uploadedFile.url);
      const filePath = path.join(process.cwd(), 'uploads', 'quotations', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Failed to delete local quotation file:', e.message);
    }
  }

  await Quotation.deleteOne({ _id: quotationId });

  // Update lead status if no remaining quotations exist
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

  await logActivity({
    leadId,
    type: 'quotation_updated',
    description: `Quotation ${quotation.quotationNumber} was deleted`,
    performedBy: deletedBy,
    metadata: { quotationId },
  });

  return { message: 'Quotation deleted successfully' };
};


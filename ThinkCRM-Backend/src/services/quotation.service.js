import fs from 'fs';
import path from 'path';
import { Quotation } from '../models/Quotation.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';
import { uploadToCloudinary, deleteFromCloudinary, getCloudinaryDownloadUrl } from '../utils/cloudinary.js';
import { sendEmail } from '../integrations/email/email.service.js';
import { logger } from '../utils/logger.js';

/**
 * Transforms quotation object so uploadedFile.url, pdfUrl, and fileUrl
 * use Cloudinary's authenticated private download URL, completely avoiding
 * CDN "401 deny or ACL failure" on PDFs.
 */
export const formatQuotationFileUrl = (quotation) => {
  if (!quotation) return quotation;
  const qObj = typeof quotation.toObject === 'function' ? quotation.toObject() : { ...quotation };

  if (qObj.uploadedFile) {
    let storageKey = qObj.uploadedFile.storageKey;
    if (!storageKey && qObj.uploadedFile.url && qObj.uploadedFile.url.includes('res.cloudinary.com')) {
      const match = qObj.uploadedFile.url.match(/(?:image|raw)\/upload\/(?:v\d+\/)?([^.]+)/);
      if (match) storageKey = match[1];
    }

    if (storageKey) {
      const format =
        qObj.uploadedFile.mimeType?.includes('pdf') || qObj.uploadedFile.fileName?.endsWith('.pdf')
          ? 'pdf'
          : (qObj.uploadedFile.fileName?.split('.').pop() || 'pdf');
      const authenticatedUrl = getCloudinaryDownloadUrl(storageKey, format, 'image');
      qObj.uploadedFile = {
        ...qObj.uploadedFile,
        url: authenticatedUrl,
        rawUrl: qObj.uploadedFile.url,
      };
      qObj.pdfUrl = authenticatedUrl;
      qObj.fileUrl = authenticatedUrl;
    } else {
      qObj.pdfUrl = qObj.uploadedFile.url;
      qObj.fileUrl = qObj.uploadedFile.url;
    }
  }
  return qObj;
};

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
      const format =
        file.mimetype?.includes('pdf') || file.originalname?.endsWith('.pdf')
          ? 'pdf'
          : (uploadResult.format || 'pdf');
      const downloadUrl = getCloudinaryDownloadUrl(uploadResult.public_id, format, 'image');

      uploadedFile = {
        fileName: file.originalname,
        url: downloadUrl || uploadResult.secure_url,
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
    description: `Quotation ${quotation.quotationNumber} uploaded for amount ₹${amount.toLocaleString('en-IN')}`,
    performedBy: createdBy,
    metadata: { quotationId: quotation._id },
  });

  // Auto-send quotation to lead in background if email is present (non-blocking)
  if (customerEmail) {
    (async () => {
      try {
        const customerDoc = customerId ? await Customer.findById(customerId) : null;
        await dispatchQuotationEmail({
          quotation,
          lead,
          customer: customerDoc,
          sentBy: createdBy,
          fileBuffer: file?.buffer,
          fileMime: file?.mimetype,
          fileName: file?.originalname,
        });
      } catch (autoSendErr) {
        logger.warn(`[createQuotation] Auto-send email warning for ${customerEmail}:`, autoSendErr?.message || autoSendErr);
      }
    })();
  } else {
    lead.status = 'quotation_pending';
    lead.quotationStatus = 'pending';
    await lead.save();
  }

  return formatQuotationFileUrl(quotation);
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
      const format =
        file.mimetype?.includes('pdf') || file.originalname?.endsWith('.pdf')
          ? 'pdf'
          : (uploadResult.format || 'pdf');
      const downloadUrl = getCloudinaryDownloadUrl(uploadResult.public_id, format, 'image');

      uploadedFile = {
        fileName: file.originalname,
        url: downloadUrl || uploadResult.secure_url,
        mimeType: file.mimetype || uploadResult.format || 'application/pdf',
        storageKey: uploadResult.public_id,
      };
    } catch (uploadError) {
      console.error('Cloudinary customer quotation upload error:', uploadError);
      throw new AppError(`Failed to upload quotation to Cloudinary: ${uploadError?.message}`, 500);
    }
  }

  let leadId = data.leadId || null;
  let linkedLead = null;
  if (leadId) {
    linkedLead = await Lead.findById(leadId);
    if (linkedLead) {
      linkedLead.status = 'quotation_pending';
      linkedLead.quotationStatus = 'pending';
      if (!linkedLead.customerId) {
        linkedLead.customerId = customer._id;
      }
      await linkedLead.save();
    }
  } else if (customer.sourceLeadId) {
    leadId = customer.sourceLeadId;
    linkedLead = await Lead.findById(leadId);
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

  // Auto-send quotation to customer in background if email is present (non-blocking)
  if (customerEmail) {
    dispatchQuotationEmail({
      quotation,
      lead: linkedLead,
      customer,
      sentBy: createdBy,
      fileBuffer: file?.buffer,
      fileMime: file?.mimetype,
      fileName: file?.originalname,
    }).catch((autoSendErr) => {
      logger.warn(`[createCustomerQuotation] Auto-send email warning for ${customerEmail}:`, autoSendErr?.message || autoSendErr);
    });
  }

  return formatQuotationFileUrl(quotation);
};

/**
 * Universal quotation email dispatcher (used by auto-send on upload and manual send)
 */
export const dispatchQuotationEmail = async ({
  quotation,
  lead,
  customer,
  sentBy,
  fileBuffer,
  fileMime,
  fileName,
}) => {
  const recipientEmail = quotation.customerEmail || customer?.email || lead?.email;
  if (!recipientEmail) {
    logger.warn(`[dispatchQuotationEmail] No email address found for quotation ${quotation.quotationNumber}, skipping email dispatch.`);
    return false;
  }

  const customerName = quotation.customerName || customer?.fullName || lead?.fullName || 'Valued Customer';
  const amountFormatted = Number(quotation.amount || 0).toLocaleString('en-IN');
  const validUntilStr = quotation.validUntil
    ? new Date(quotation.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const html = `
    <p>Dear <strong>${customerName}</strong>,</p>
    <p>${quotation.message || 'Thank you for choosing ThinkTive. Please find attached the official quotation for your project.'}</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 15px;"><strong>Quotation Number:</strong> ${quotation.quotationNumber}</p>
      <p style="margin: 0 0 8px 0; font-size: 16px; color: #0284c7;"><strong>Total Amount:</strong> ₹${amountFormatted}</p>
      ${validUntilStr ? `<p style="margin: 0; font-size: 14px; color: #64748b;"><strong>Valid Until:</strong> ${validUntilStr}</p>` : ''}
    </div>
    <p style="font-size: 14px; color: #475569;">The complete quotation document is attached to this email for your review.</p>
    <p style="font-size: 14px; color: #475569;">If you have any questions or wish to proceed with the next steps, feel free to reply directly to this email.</p>
    <br/>
    <p style="margin: 0; font-size: 14px; color: #334155;">Best regards,</p>
    <p style="margin: 2px 0 0 0; font-size: 15px; font-weight: 700; color: #0f172a;">ThinkTive Team</p>
  `;

  // Prepare attachments (supports buffer from fresh upload or Cloudinary URL)
  const attachments = [];
  if (fileBuffer) {
    attachments.push({
      filename: fileName || quotation.uploadedFile?.fileName || `Quotation-${quotation.quotationNumber}.pdf`,
      content: fileBuffer,
      contentType: fileMime || quotation.uploadedFile?.mimeType || 'application/pdf',
    });
  } else if (quotation.uploadedFile?.url) {
    attachments.push({
      filename: quotation.uploadedFile?.fileName || `Quotation-${quotation.quotationNumber}.pdf`,
      path: quotation.uploadedFile.url,
      contentType: quotation.uploadedFile?.mimeType || 'application/pdf',
    });
  }

  await sendEmail({
    to: recipientEmail,
    subject: `Quotation ${quotation.quotationNumber} from ThinkTive (₹${amountFormatted})`,
    html,
    attachments,
  });

  quotation.status = 'sent';
  quotation.sentAt = new Date();
  if (sentBy) quotation.sentBy = sentBy;
  await quotation.save();

  if (lead) {
    lead.status = 'quotation_sent';
    lead.quotationStatus = 'sent';
    await lead.save();
  }

  await logActivity({
    leadId: lead?._id || quotation.leadId || undefined,
    customerId: customer?._id || quotation.customerId || undefined,
    type: 'quotation_sent',
    description: `Quotation ${quotation.quotationNumber} was automatically sent to ${recipientEmail}`,
    performedBy: sentBy,
    metadata: { quotationId: quotation._id, recipient: recipientEmail },
  });

  if (lead && lead.assignedTo && sentBy && lead.assignedTo.toString() !== sentBy.toString()) {
    await createNotification({
      recipient: lead.assignedTo,
      type: 'quotation_sent',
      title: 'Quotation Sent',
      message: `Quotation ${quotation.quotationNumber} has been sent to customer for lead ${lead.fullName}.`,
      entityType: 'Quotation',
      entityId: quotation._id,
    });
  }

  return true;
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

  try {
    await dispatchQuotationEmail({
      quotation,
      lead,
      customer,
      sentBy,
    });
  } catch (emailErr) {
    logger.error(`[sendQuotation] Failed to deliver quotation email:`, emailErr);
    throw new AppError(`Failed to send quotation email: ${emailErr?.message || 'SMTP delivery error'}`, 400);
  }

  return formatQuotationFileUrl(quotation);
};

export const getLeadQuotations = async (leadId) => {
  const quotations = await Quotation.find({ leadId })
    .sort({ createdAt: -1 })
    .populate('createdBy sentBy', 'firstName lastName');
  return quotations.map(formatQuotationFileUrl);
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

  const quotations = await Quotation.find({ $or: queryOr })
    .sort({ createdAt: -1 })
    .populate('createdBy sentBy', 'firstName lastName avatar')
    .populate('leadId', 'leadId fullName projectType status');
  return quotations.map(formatQuotationFileUrl);
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

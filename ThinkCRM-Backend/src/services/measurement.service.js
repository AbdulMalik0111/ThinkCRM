import { Measurement } from '../models/Measurement.js';
import { Lead } from '../models/Lead.js';
import { AppError } from '../utils/AppError.js';
import { logActivity } from './activity.service.js';
import { createNotification } from './notification.service.js';

export const createMeasurement = async (leadId, data, createdBy) => {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  const measurement = await Measurement.create({
    ...data,
    leadId,
    createdBy,
    assignedTo: data.assignedTo || lead.assignedTo,
    status: data.scheduledAt ? 'scheduled' : 'pending',
  });

  if (lead.status !== 'measurement_scheduled' && lead.status !== 'measurement_completed') {
    lead.status = data.scheduledAt ? 'measurement_scheduled' : 'measurement_pending';
    await lead.save();
  }

  await logActivity({
    leadId,
    type: 'measurement_scheduled',
    description: `Measurement ${data.scheduledAt ? 'scheduled for ' + new Date(data.scheduledAt).toLocaleString() : 'created'}`,
    performedBy: createdBy,
    metadata: { measurementId: measurement._id },
  });

  if (measurement.assignedTo && measurement.assignedTo.toString() !== createdBy.toString()) {
    await createNotification({
      recipient: measurement.assignedTo,
      type: 'measurement_scheduled',
      title: 'New Measurement Assigned',
      message: `A measurement has been assigned to you for lead ${lead.fullName}.`,
      entityType: 'Measurement',
      entityId: measurement._id,
    });
  }

  return measurement;
};

export const updateMeasurement = async (measurementId, data, updatedBy) => {
  const measurement = await Measurement.findById(measurementId).populate('leadId');
  if (!measurement) {
    throw new AppError('Measurement not found', 404);
  }

  const oldStatus = measurement.status;
  
  Object.assign(measurement, data);
  measurement.updatedBy = updatedBy;

  if (data.status === 'completed' && oldStatus !== 'completed') {
    measurement.completedAt = Date.now();
    
    // Update lead status
    const lead = measurement.leadId;
    lead.status = 'measurement_completed';
    await lead.save();
    
    await logActivity({
      leadId: lead._id,
      type: 'measurement_completed',
      description: 'Measurement was completed',
      performedBy: updatedBy,
      metadata: { measurementId: measurement._id },
    });
  }

  await measurement.save();
  return measurement;
};

export const getLeadMeasurements = async (leadId) => {
  return await Measurement.find({ leadId }).sort({ createdAt: -1 }).populate('assignedTo', 'firstName lastName');
};

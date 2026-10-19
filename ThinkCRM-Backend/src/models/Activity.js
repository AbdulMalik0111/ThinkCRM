import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: false,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'lead_created',
        'lead_updated',
        'lead_assigned',
        'lead_reassigned',
        'status_changed',
        'follow_up_created',
        'follow_up_completed',
        'measurement_scheduled',
        'measurement_completed',
        'measurement_updated',
        'quotation_uploaded',
        'quotation_sent',
        'quotation_updated',
        'note_added',
        'file_uploaded',
        'staff_changed',
        'customer_created',
        'customer_updated',
        'customer_deleted',
        'customer_note_added',
        'customer_file_uploaded',
        'customer_email_sent',
        'customer_call_logged',
        'customer_whatsapp_sent',
        'project_created',
        'project_updated',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Activity = mongoose.model('Activity', activitySchema);

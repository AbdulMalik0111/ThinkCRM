import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
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
        'quotation_uploaded',
        'quotation_sent',
        'note_added',
        'file_uploaded',
        'staff_changed',
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

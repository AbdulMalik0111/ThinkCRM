import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'whatsapp', 'email', 'site_visit', 'measurement', 'quotation', 'quotation_followup', 'other'],
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'overdue'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    notes: {
      type: String,
    },
    outcome: {
      type: String,
      enum: ['no_answer', 'busy', 'call_back', 'interested', 'not_interested', 'wrong_number', 'connected', 'follow_up_required', ''],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reminder10mSent: {
      type: Boolean,
      default: false,
    },
    reminder5mSent: {
      type: Boolean,
      default: false,
    },
    reminder0mSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const FollowUp = mongoose.model('FollowUp', followUpSchema);

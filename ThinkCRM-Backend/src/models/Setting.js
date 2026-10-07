import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'ThinkCRM',
    },
    companyEmail: {
      type: String,
      default: 'contact@thinkcrm.com',
    },
    companyPhone: {
      type: String,
      default: '+1234567890',
    },
    companyAddress: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    emailSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    leadSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    notificationSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    defaultAssignmentSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);

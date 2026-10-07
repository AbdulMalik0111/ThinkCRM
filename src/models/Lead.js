import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    leadId: {
      type: String,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    alternatePhone: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      index: true,
    },
    location: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    projectType: {
      type: String,
      enum: ['Kitchen', 'Wardrobe', 'Bedroom', 'Living Room', 'Office', 'Full Home', 'Commercial', 'Other'],
      required: true,
    },
    projectDescription: {
      type: String,
    },
    budget: {
      type: Number,
    },
    expectedStartDate: {
      type: Date,
    },
    leadSource: {
      type: String,
      enum: ['Meta', 'Facebook', 'Instagram', 'Website', 'Google', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other'],
      default: 'Manual',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'new', 'attempted', 'contacted', 'qualified', 'follow_up', 
        'measurement_pending', 'measurement_scheduled', 'measurement_completed', 
        'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'lost', 'junk'
      ],
      default: 'new',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastContactAt: {
      type: Date,
    },
    nextFollowUpAt: {
      type: Date,
      index: true,
    },
    notes: {
      type: String,
    },
    tags: {
      type: [String],
    },
    metaLeadId: {
      type: String,
      index: true,
      sparse: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save to generate leadId if not provided
leadSchema.pre('save', async function (next) {
  if (this.isNew && !this.leadId) {
    const count = await mongoose.model('Lead').countDocuments();
    this.leadId = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Exclude soft deleted
leadSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

export const Lead = mongoose.model('Lead', leadSchema);

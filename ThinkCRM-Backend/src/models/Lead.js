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
      index: true,
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
      enum: ['Kitchen', 'Modular Kitchen', 'Wardrobe', 'Wardrobe Design', 'Bedroom', 'Living Room', 'Office', 'Office Interior', 'Full Home', 'Full Home Interior', 'Commercial', 'Other'],
      required: true,
      default: 'Full Home',
    },
    projectDescription: {
      type: String,
    },
    budget: {
      type: Number,
    },
    budgetRange: {
      type: String,
    },
    preferredTimeline: {
      type: String,
    },
    expectedStartDate: {
      type: Date,
    },
    leadSource: {
      type: String,
      enum: ['Meta', 'Meta Ads', 'Facebook', 'Instagram', 'Website', 'Google', 'Google Ads', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other'],
      default: 'Website',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'new', 'attempted', 'contacted', 'qualified', 'follow_up', 'in_progress',
        'measurement_pending', 'measurement_scheduled', 'measurement_completed', 
        'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'converted', 'lost', 'junk'
      ],
      default: 'new',
      index: true,
    },
    measurementStatus: {
      type: String,
      enum: ['not_done', 'pending', 'scheduled', 'done', 'completed'],
      default: 'not_done',
      index: true,
    },
    quotationStatus: {
      type: String,
      enum: ['pending', 'sent', 'approved', 'draft', 'rejected', 'not_uploaded'],
      default: 'pending',
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
    notesList: [
      {
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number },
        type: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

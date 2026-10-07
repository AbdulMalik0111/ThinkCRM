import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema(
  {
    quotationId: {
      type: String,
      unique: true,
      index: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
    },
    uploadedFile: {
      fileName: String,
      url: String,
      mimeType: String,
      storageKey: String,
    },
    quotationNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
      default: 'draft',
      index: true,
    },
    message: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate quotationId before save
quotationSchema.pre('save', async function (next) {
  if (this.isNew && !this.quotationId) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationId = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Quotation = mongoose.model('Quotation', quotationSchema);

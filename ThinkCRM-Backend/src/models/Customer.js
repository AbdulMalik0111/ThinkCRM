import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerId: {
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
    email: {
      type: String,
      lowercase: true,
      index: true,
    },
    address: {
      type: String,
    },
    location: {
      type: String,
    },
    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.pre('save', async function (next) {
  if (this.isNew && !this.customerId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerId = `CUS-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export const Customer = mongoose.model('Customer', customerSchema);

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
      index: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      index: true,
    },
    avatar: {
      type: String,
    },
    source: {
      type: String,
      default: 'Website',
    },
    status: {
      type: String,
      enum: ['active', 'in_progress', 'completed', 'on_hold'],
      default: 'active',
      index: true,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    address: {
      type: String,
    },
    city: {
      type: String,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'India',
    },
    location: {
      type: String,
      trim: true,
    },
    customerType: {
      type: String,
      enum: ['individual', 'business'],
      default: 'individual',
    },
    companyName: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    projectType: {
      type: String,
      trim: true,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    projects: [
      {
        projectName: {
          type: String,
          required: true,
        },
        projectType: {
          type: String,
          required: true,
        },
        description: String,
        budget: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ['active', 'in_progress', 'completed', 'on_hold'],
          default: 'active',
        },
        startDate: Date,
        completionDate: Date,
        assignedStaff: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        leadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lead',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    documents: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        fileType: String,
        size: Number,
        publicId: String,
        category: {
          type: String,
          default: 'Other',
        },
        leadId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lead',
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: false,
      sparse: true,
    },
    leads: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
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

  // Auto-compose location from city, state if not explicitly given
  if (!this.location && (this.city || this.state)) {
    this.location = [this.city, this.state].filter(Boolean).join(', ');
  }

  // Calculate totalValue from projects if present
  if (this.projects && this.projects.length > 0) {
    const sum = this.projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
    if (sum > 0) {
      this.totalValue = sum;
    }
  }

  next();
});

export const Customer = mongoose.model('Customer', customerSchema);

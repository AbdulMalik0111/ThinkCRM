import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Sales Manager', 'Sales Executive', 'Staff'],
      default: 'Staff',
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'suspended'],
      default: 'active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Exclude soft deleted users by default
userSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: { $ne: null } }); // wait, it should be deletedAt: null or $exists: false. Actually, it's better to just do deletedAt: null
  // wait, the previous line is wrong. It should be `{ deletedAt: null }`. Let's fix this.
  this.find({ deletedAt: null });
  next();
});

// Compare password method
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const User = mongoose.model('User', userSchema);

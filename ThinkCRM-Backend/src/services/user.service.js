import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { AppError } from '../utils/AppError.js';
import { normalizePhone } from '../utils/normalize.js';

export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  let cleanPhone = userData.phone;
  if (cleanPhone) {
    const { canonical } = normalizePhone(cleanPhone);
    cleanPhone = canonical || cleanPhone.trim();
  }

  const user = await User.create({
    ...userData,
    phone: cleanPhone || undefined,
    passwordHash: userData.password, // handled by pre-save hook
  });
  
  user.passwordHash = undefined;
  return user;
};

export const getAllUsers = async (query = {}) => {
  const { page = 1, limit = 50, search = '', status } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  let filter = {};
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { role: { $regex: search, $options: 'i' } }
    ];
  }

  // exclude deleted staff
  filter.deletedAt = null;

  const users = await User.find(filter)
    .select('-passwordHash -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit)) || 1;

  return {
    users,
    total,
    totalPages,
    currentPage: parseInt(page),
  };
};

export const getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid staff ID', 400);
  }
  const user = await User.findById(userId).select('-passwordHash -refreshToken');
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  return user;
};

export const updateUser = async (userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid staff ID', 400);
  }

  const cleanData = { ...updateData };
  if (cleanData.phone !== undefined) {
    if (cleanData.phone) {
      const { canonical } = normalizePhone(cleanData.phone);
      cleanData.phone = canonical || cleanData.phone.trim();
    } else {
      cleanData.phone = null;
    }
  }

  const user = await User.findByIdAndUpdate(userId, cleanData, {
    new: true,
    runValidators: true,
  }).select('-passwordHash -refreshToken');

  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  return user;
};

export const deleteUser = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid staff ID', 400);
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }
  
  user.deletedAt = Date.now();
  user.isActive = false;
  user.status = 'disabled';
  await user.save({ validateBeforeSave: false });
};

export const generateTempPassword = () => {
  // Generate a random, human-friendly, yet cryptographically strong temporary password
  // Format: Think# + 4 random uppercase/lowercase chars + 2 random digits, e.g. Think#xK9m21
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  for (let i = 0; i < 2; i++) {
    randomPart += digits[crypto.randomInt(0, digits.length)];
  }
  return `Think#${randomPart}`;
};

export const resetPassword = async (userId, customPassword = null) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid staff ID', 400);
  }

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new AppError('Staff member not found', 404);
  }

  const tempPassword = customPassword && customPassword.trim().length >= 6
    ? customPassword.trim()
    : generateTempPassword();

  user.passwordHash = tempPassword;
  user.refreshToken = null;
  await user.save();

  return {
    tempPassword,
    user,
  };
};

export const getStaffActivity = async (userId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid staff ID', 400);
  }

  const { limit = 50 } = query;
  const rawActivities = await Activity.find({ performedBy: userId })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10));

  const activity = rawActivities.map((act) => ({
    _id: act._id,
    action: act.type,
    entityType: act.customerId ? 'Customer' : act.leadId ? 'Lead' : 'System',
    createdAt: act.createdAt,
    details: {
      description: act.description,
      ...(act.metadata || {}),
    },
  }));

  return activity;
};

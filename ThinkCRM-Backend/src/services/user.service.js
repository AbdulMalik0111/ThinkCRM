import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const user = await User.create({
    ...userData,
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
  filter.deletedAt = { $exists: false };

  const users = await User.find(filter)
    .select('-passwordHash -refreshToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / parseInt(limit));

  return {
    users,
    total,
    totalPages,
    currentPage: parseInt(page),
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash -refreshToken');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const updateUser = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-passwordHash -refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }
  return user;
};

export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  user.deletedAt = Date.now();
  user.isActive = false;
  user.status = 'disabled';
  await user.save({ validateBeforeSave: false });
};

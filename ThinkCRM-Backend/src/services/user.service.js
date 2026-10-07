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
  const users = await User.find(query).select('-passwordHash -refreshToken');
  return users;
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

import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateTokens } from '../utils/token.js';

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+passwordHash +refreshToken');
  
  if (!user || !(await user.correctPassword(password, user.passwordHash))) {
    throw new AppError('Incorrect email or password', 401);
  }

  if (user.status !== 'active' || !user.isActive) {
    throw new AppError('Your account has been deactivated', 401);
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  user.lastLoginAt = Date.now();
  await user.save({ validateBeforeSave: false });

  user.passwordHash = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!(await user.correctPassword(currentPassword, user.passwordHash))) {
    throw new AppError('Incorrect current password', 401);
  }

  user.passwordHash = newPassword;
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  user.passwordHash = undefined;
  user.refreshToken = undefined;
  
  return { user, accessToken, refreshToken };
};

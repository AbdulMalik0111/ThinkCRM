import { verifyAccessToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    const decoded = verifyAccessToken(token);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.status !== 'active' || !currentUser.isActive) {
      return next(new AppError('Your account has been deactivated.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired! Please log in again.', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    // Owner always has full access, skip permission check
    if (req.user.role === 'Owner' || req.user.role === 'Admin') {
      return next();
    }
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return next(new AppError(`You do not have the required permission: ${permission}`, 403));
    }
    next();
  };
};

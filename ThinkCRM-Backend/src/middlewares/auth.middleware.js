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

export const ROLE_DEFAULT_PERMISSIONS = {
  Owner: ['all'],
  Admin: ['all'],
  'Sales Manager': [
    'leads.view',
    'leads.create',
    'leads.update',
    'leads.assign',
    'customers.view',
    'customers.create',
    'customers.update',
    'quotations.view',
    'quotations.create',
    'quotations.send',
    'measurements.view',
    'measurements.create',
    'measurements.update',
    'reports.view',
    'notifications.view',
  ],
  'Sales Executive': [
    'leads.view',
    'leads.create',
    'leads.update',
    'customers.view',
    'customers.create',
    'customers.update',
    'quotations.view',
    'quotations.create',
    'quotations.send',
    'measurements.view',
    'measurements.create',
    'measurements.update',
    'reports.view',
    'notifications.view',
  ],
  Staff: [
    'leads.view',
    'leads.create',
    'leads.update',
    'customers.view',
    'customers.create',
    'customers.update',
    'quotations.view',
    'quotations.create',
    'quotations.send',
    'measurements.view',
    'measurements.create',
    'measurements.update',
    'reports.view',
    'notifications.view',
  ],
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Owner and Admin always have full access, skip permission check
    if (req.user.role === 'Owner' || req.user.role === 'Admin') {
      return next();
    }

    const roleDefaults = ROLE_DEFAULT_PERMISSIONS[req.user.role] || [];
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    const allPermissions = Array.from(new Set([...roleDefaults, ...userPermissions]));

    if (allPermissions.includes('all') || allPermissions.includes(permission)) {
      return next();
    }

    return next(new AppError(`You do not have the required permission: ${permission}`, 403));
  };
};

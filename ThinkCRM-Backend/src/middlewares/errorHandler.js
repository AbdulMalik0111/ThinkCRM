import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export const errorHandler = (err, req, res, next) => {
  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path || 'ID'}: ${err.value}`, 400);
  }
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errorMsgs = Object.values(err.errors || {}).map((el) => el.message);
    err = new AppError(`Validation error: ${errorMsgs.join('. ')}`, 400);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    logger.error(err);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      stack: err.stack,
    });
  } else {
    // Production
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors || [],
      });
    } else {
      logger.error('ERROR 💥', err);
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Something went wrong while processing your request',
      });
    }
  }
};

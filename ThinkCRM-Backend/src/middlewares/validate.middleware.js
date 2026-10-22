import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    let payload = req.body;
    if (
      payload &&
      typeof payload === 'object' &&
      payload.data &&
      typeof payload.data === 'object' &&
      !Array.isArray(payload.data) &&
      (!schema.shape || !('data' in schema.shape))
    ) {
      payload = payload.data;
    }
    req.body = schema.parse(payload);
    next();
  } catch (error) {
    const formattedErrors = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })) || [{ message: error.message }];
    next(new AppError('Validation failed', 400, formattedErrors));
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    next(new AppError('Query validation failed', 400, formattedErrors));
  }
};

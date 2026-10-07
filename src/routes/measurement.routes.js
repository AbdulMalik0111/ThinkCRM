import express from 'express';
import * as measurementController from '../controllers/measurement.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { updateMeasurementSchema } from '../validators/measurement.validator.js';

const router = express.Router();

router.use(protect);

router
  .route('/:id')
  .patch(
    requirePermission('measurements.update'),
    validate(updateMeasurementSchema),
    measurementController.updateMeasurement
  );

export default router;

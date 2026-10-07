import express from 'express';
import * as leadController from '../controllers/lead.controller.js';
import * as followupController from '../controllers/followup.controller.js';
import * as measurementController from '../controllers/measurement.controller.js';
import * as quotationController from '../controllers/quotation.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import { createLeadSchema, updateLeadSchema, assignLeadSchema } from '../validators/lead.validator.js';
import { createFollowUpSchema } from '../validators/followup.validator.js';
import { createMeasurementSchema } from '../validators/measurement.validator.js';
import { createQuotationSchema } from '../validators/quotation.validator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(requirePermission('leads.view'), leadController.getLeads)
  .post(
    requirePermission('leads.create'),
    validate(createLeadSchema),
    leadController.createLead
  );

router
  .route('/:id')
  .get(requirePermission('leads.view'), leadController.getLeadById)
  .patch(
    requirePermission('leads.update'),
    validate(updateLeadSchema),
    leadController.updateLead
  )
  .delete(requirePermission('leads.delete'), leadController.deleteLead);

router.post(
  '/:id/assign',
  requirePermission('leads.assign'),
  validate(assignLeadSchema),
  leadController.assignLead
);

router.get('/:id/activities', requirePermission('leads.view'), leadController.getLeadActivities);

router
  .route('/:id/follow-ups')
  .get(requirePermission('leads.view'), followupController.getLeadFollowUps)
  .post(
    requirePermission('leads.update'),
    validate(createFollowUpSchema),
    followupController.createFollowUp
  );

router
  .route('/:id/measurements')
  .get(requirePermission('measurements.view'), measurementController.getLeadMeasurements)
  .post(
    requirePermission('measurements.create'),
    validate(createMeasurementSchema),
    measurementController.createMeasurement
  );

router
  .route('/:id/quotations')
  .get(requirePermission('quotations.view'), quotationController.getLeadQuotations)
  .post(
    requirePermission('quotations.create'),
    upload.single('file'),
    (req, res, next) => {
      // Body might be stringified if sent as multipart/form-data
      if (typeof req.body.data === 'string') {
        try {
          req.body = JSON.parse(req.body.data);
        } catch (e) {
          // Ignore
        }
      }
      next();
    },
    validate(createQuotationSchema),
    quotationController.createQuotation
  );

router.post(
  '/:id/quotations/:quotationId/send',
  requirePermission('quotations.send'),
  quotationController.sendQuotation
);

export default router;

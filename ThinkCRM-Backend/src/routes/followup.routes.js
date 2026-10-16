import express from 'express';
import * as followupController from '../controllers/followup.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { updateFollowUpSchema } from '../validators/followup.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', requirePermission('leads.view'), followupController.getAllFollowUps);

router
  .route('/:id')
  .patch(
    requirePermission('leads.update'),
    validate(updateFollowUpSchema),
    followupController.updateFollowUp
  )
  .delete(
    requirePermission('leads.update'),
    followupController.deleteFollowUp
  );

export default router;

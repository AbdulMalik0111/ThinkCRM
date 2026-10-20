import express from 'express';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import * as quotationController from '../controllers/quotation.controller.js';

const router = express.Router();

router.use(protect);

// Send quotation directly by quotationId
router
  .route('/:quotationId/send')
  .post(requirePermission('quotations.send'), quotationController.sendQuotation);

// Delete quotation directly by quotationId
router
  .route('/:quotationId')
  .delete(requirePermission('quotations.delete'), quotationController.deleteQuotation);

export default router;

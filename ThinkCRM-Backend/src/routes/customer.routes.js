import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addCustomerProjectSchema,
  logCustomerCallSchema,
} from '../validators/customer.validator.js';
import { createFollowUpSchema, updateFollowUpSchema } from '../validators/followup.validator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(requirePermission('customers.view'), customerController.getCustomers)
  .post(
    requirePermission('customers.create'),
    validate(createCustomerSchema),
    customerController.createCustomer
  );

router.post(
  '/import',
  requirePermission('customers.create'),
  customerController.importCustomers
);

// Deduplication routes
router.get(
  '/duplicates',
  requirePermission('customers.view'),
  customerController.getDuplicateCustomers
);

router.post(
  '/merge',
  requirePermission('customers.update'),
  customerController.resolveDuplicateCustomers
);

router
  .route('/:id')
  .get(requirePermission('customers.view'), customerController.getCustomerById)
  .patch(
    requirePermission('customers.update'),
    validate(updateCustomerSchema),
    customerController.updateCustomer
  )
  .delete(requirePermission('customers.delete'), customerController.deleteCustomer);

router
  .route('/:id/notes')
  .post(requirePermission('customers.update'), customerController.addCustomerNote);

router
  .route('/:id/notes/:noteId')
  .patch(requirePermission('customers.update'), customerController.updateCustomerNote)
  .delete(requirePermission('customers.update'), customerController.deleteCustomerNote);

router
  .route('/:id/documents')
  .post(
    requirePermission('customers.update'),
    upload.single('file'),
    customerController.addCustomerDocument
  );

router
  .route('/:id/documents/:docId')
  .delete(requirePermission('customers.update'), customerController.deleteCustomerDocument);

router
  .route('/:id/projects')
  .post(
    requirePermission('customers.update'),
    validate(addCustomerProjectSchema),
    customerController.addCustomerProject
  );

router
  .route('/:id/follow-ups')
  .post(
    requirePermission('customers.update'),
    validate(createFollowUpSchema),
    customerController.createCustomerFollowUp
  );

router
  .route('/:id/follow-ups/:followUpId')
  .patch(
    requirePermission('customers.update'),
    validate(updateFollowUpSchema),
    customerController.updateCustomerFollowUp
  )
  .delete(requirePermission('customers.update'), customerController.deleteCustomerFollowUp);

router
  .route('/:id/quotations')
  .post(
    requirePermission('customers.update'),
    upload.single('file'),
    customerController.createCustomerQuotation
  );

router
  .route('/:id/quotations/:quotationId/send')
  .post(requirePermission('customers.update'), customerController.sendCustomerQuotation);

router
  .route('/:id/quotations/:quotationId')
  .delete(requirePermission('customers.update'), customerController.deleteCustomerQuotation);

router
  .route('/:id/email')
  .post(requirePermission('customers.update'), customerController.sendCustomerEmail);

router
  .route('/:id/calls')
  .post(
    requirePermission('customers.update'),
    validate(logCustomerCallSchema),
    customerController.logCustomerCall
  );

router
  .route('/:id/whatsapp')
  .post(requirePermission('customers.update'), customerController.logCustomerWhatsApp);

export default router;

import express from 'express';
import * as customerController from '../controllers/customer.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.validator.js';

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
  .delete(requirePermission('customers.update'), customerController.deleteCustomerNote);

router
  .route('/:id/documents')
  .post(requirePermission('customers.update'), customerController.addCustomerDocument);

router
  .route('/:id/documents/:docId')
  .delete(requirePermission('customers.update'), customerController.deleteCustomerDocument);

router
  .route('/:id/projects')
  .post(requirePermission('customers.update'), customerController.addCustomerProject);

router
  .route('/:id/follow-ups')
  .post(requirePermission('customers.update'), customerController.createCustomerFollowUp);

router
  .route('/:id/email')
  .post(requirePermission('customers.update'), customerController.sendCustomerEmail);

export default router;

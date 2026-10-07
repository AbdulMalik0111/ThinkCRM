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
    customerController.convertLeadToCustomer
  );

router
  .route('/:id')
  .get(requirePermission('customers.view'), customerController.getCustomerById)
  .patch(
    requirePermission('customers.update'),
    validate(updateCustomerSchema),
    customerController.updateCustomer
  );

export default router;

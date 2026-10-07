import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, restrictTo, requirePermission } from '../middlewares/auth.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(requirePermission('staff.view'), userController.getAllUsers)
  .post(
    restrictTo('Owner', 'Admin'), // only high-level roles can create
    requirePermission('staff.create'),
    validate(createUserSchema),
    userController.createUser
  );

router
  .route('/:id')
  .get(requirePermission('staff.view'), userController.getUserById)
  .patch(
    requirePermission('staff.update'),
    validate(updateUserSchema),
    userController.updateUser
  )
  .delete(requirePermission('staff.delete'), userController.deleteUser);

export default router;

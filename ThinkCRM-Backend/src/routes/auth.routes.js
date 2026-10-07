import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect } from '../middlewares/auth.middleware.js';
import { loginSchema, changePasswordSchema } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

export default router;

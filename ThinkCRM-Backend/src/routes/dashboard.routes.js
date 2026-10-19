import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', dashboardController.getDashboardStats);
router.get('/stats', dashboardController.getDashboardStats);

export default router;

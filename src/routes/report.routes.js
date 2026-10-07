import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(requirePermission('reports.view'));

router.get('/leads', reportController.getLeadReports);
router.get('/sales', reportController.getSalesReports);
router.get('/staff', reportController.getStaffReports);

export default router;

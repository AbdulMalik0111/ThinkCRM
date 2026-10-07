import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import leadRoutes from './lead.routes.js';
import followupRoutes from './followup.routes.js';
import notificationRoutes from './notification.routes.js';
import measurementRoutes from './measurement.routes.js';
import customerRoutes from './customer.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportRoutes from './report.routes.js';
import settingRoutes from './setting.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/staff', userRoutes);
router.use('/leads', leadRoutes);
router.use('/follow-ups', followupRoutes);
router.use('/notifications', notificationRoutes);
router.use('/measurements', measurementRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);

export default router;

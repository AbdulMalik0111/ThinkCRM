import express from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', requirePermission('notifications.view'), notificationController.getUnreadCount);
router.patch('/read-all', requirePermission('notifications.view'), notificationController.markAllAsRead);

router
  .route('/')
  .get(requirePermission('notifications.view'), notificationController.getNotifications);

router
  .route('/:id/read')
  .patch(requirePermission('notifications.view'), notificationController.markAsRead);

export default router;

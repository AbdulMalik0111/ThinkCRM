import * as notificationService from '../services/notification.service.js';

export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotifications(req.user._id, req.query);
    res.status(200).json({
      success: true,
      message: 'Notifications fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Unread count fetched successfully',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

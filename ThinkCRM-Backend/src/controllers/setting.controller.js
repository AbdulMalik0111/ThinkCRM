import * as settingService from '../services/setting.service.js';

export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingService.getSettings();
    res.status(200).json({
      success: true,
      message: 'Settings fetched successfully',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingService.updateSettings(req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

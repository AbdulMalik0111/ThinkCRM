import express from 'express';
import * as settingController from '../controllers/setting.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { protect, requirePermission } from '../middlewares/auth.middleware.js';
import { updateSettingSchema } from '../validators/setting.validator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(requirePermission('settings.view'), settingController.getSettings)
  .patch(
    requirePermission('settings.update'),
    validate(updateSettingSchema),
    settingController.updateSettings
  );

export default router;

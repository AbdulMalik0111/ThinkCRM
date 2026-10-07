import { Setting } from '../models/Setting.js';
import { logAudit } from './audit.service.js';

export const getSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return settings;
};

export const updateSettings = async (updateData, updatedBy) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }

  const oldSettings = settings.toObject();

  Object.assign(settings, updateData);
  await settings.save();

  await logAudit({
    actor: updatedBy,
    action: 'settings_changed',
    entity: 'Setting',
    entityId: settings._id,
    oldValue: oldSettings,
    newValue: settings.toObject(),
  });

  return settings;
};

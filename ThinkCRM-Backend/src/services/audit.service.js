import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ actor, action, entity, entityId, oldValue, newValue, ip }) => {
  // Sanitize values
  const sanitize = (val) => {
    if (!val) return val;
    const sanitized = JSON.parse(JSON.stringify(val));
    const secrets = ['password', 'passwordHash', 'refreshToken', 'token', 'secret'];
    for (const key of Object.keys(sanitized)) {
      if (secrets.includes(key) || key.toLowerCase().includes('password') || key.toLowerCase().includes('secret')) {
        sanitized[key] = '***';
      }
    }
    return sanitized;
  };

  return await AuditLog.create({
    actor,
    action,
    entity,
    entityId,
    oldValue: sanitize(oldValue),
    newValue: sanitize(newValue),
    ip,
  });
};

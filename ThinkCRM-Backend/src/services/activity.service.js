import { Activity } from '../models/Activity.js';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';

export const logActivity = async ({ leadId, customerId, type, description, metadata, performedBy }) => {
  if (!performedBy) {
    return null;
  }
  const data = {
    type,
    description,
    metadata,
    performedBy,
  };
  if (leadId) data.leadId = leadId;
  if (customerId) data.customerId = customerId;

  try {
    return await Activity.create(data);
  } catch (err) {
    console.warn('logActivity warning:', err.message);
    return null;
  }
};

export const getLeadActivities = async (leadId) => {
  const activities = await Activity.find({ leadId })
    .sort({ createdAt: -1 })
    .populate('performedBy', 'firstName lastName avatar');

  // Self-heal legacy activities with truncated note descriptions
  try {
    const truncatedActs = activities.filter(
      (a) => a.type === 'note_added' && (a.description?.includes('..."') || a.description?.includes('...""'))
    );
    if (truncatedActs.length > 0) {
      const lead = await Lead.findById(leadId).select('notesList');
      if (lead?.notesList?.length) {
        for (const act of truncatedActs) {
          const matchPrefix = act.description
            .replace(/^Note added:\s*"/, '')
            .replace(/\.\.\."*$/, '')
            .trim();
          const matchedNote = lead.notesList.find(
            (n) => n.content && n.content.trim().startsWith(matchPrefix.slice(0, 30))
          );
          if (matchedNote) {
            act.description = `Note added: "${matchedNote.content.trim()}"`;
            if (!act.metadata) act.metadata = {};
            act.metadata.content = matchedNote.content.trim();
            Activity.updateOne(
              { _id: act._id },
              { $set: { description: act.description, metadata: act.metadata } }
            ).exec();
          }
        }
      }
    }
  } catch (err) {
    console.warn('Could not heal truncated lead activities:', err.message);
  }

  return activities;
};

export const getCustomerActivities = async (customerId, leadId) => {
  const or = [];
  if (customerId) or.push({ customerId });
  if (leadId) or.push({ leadId });

  const query = or.length > 0 ? { $or: or } : {};
  const activities = await Activity.find(query)
    .sort({ createdAt: -1 })
    .populate('performedBy', 'firstName lastName avatar email');

  // Self-heal legacy customer note activities with truncated descriptions
  try {
    const truncatedActs = activities.filter(
      (a) =>
        (a.type === 'customer_note_added' || a.type === 'note_added') &&
        (a.description?.includes('..."') || a.description?.includes('...""'))
    );
    if (truncatedActs.length > 0) {
      const customer = customerId ? await Customer.findById(customerId).select('fullName notes sourceLeadId') : null;
      const lId = leadId || customer?.sourceLeadId;
      const lead = lId ? await Lead.findById(lId).select('notesList') : null;

      for (const act of truncatedActs) {
        const matchPrefix = act.description
          .replace(/^Note added[^:]*:\s*"/, '')
          .replace(/\.\.\."*$/, '')
          .trim();
        const matchedCustNote = customer?.notes?.find(
          (n) => n.content && n.content.trim().startsWith(matchPrefix.slice(0, 30))
        );
        const matchedLeadNote = lead?.notesList?.find(
          (n) => n.content && n.content.trim().startsWith(matchPrefix.slice(0, 30))
        );
        const fullContent = matchedCustNote?.content || matchedLeadNote?.content;
        if (fullContent) {
          act.description = act.type === 'customer_note_added' && customer
            ? `Note added to customer ${customer.fullName}: "${fullContent.trim()}"`
            : `Note added: "${fullContent.trim()}"`;
          if (!act.metadata) act.metadata = {};
          act.metadata.content = fullContent.trim();
          Activity.updateOne(
            { _id: act._id },
            { $set: { description: act.description, metadata: act.metadata } }
          ).exec();
        }
      }
    }
  } catch (err) {
    console.warn('Could not heal truncated customer activities:', err.message);
  }

  return activities;
};


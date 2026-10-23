import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Measurement } from '../models/Measurement.js';
import { Quotation } from '../models/Quotation.js';
import { Customer } from '../models/Customer.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const leadBase = { isDeleted: false };
    const custBase = { deletedAt: null };
    const followUpBase = {};
    const measurementBase = {};
    const quotationBase = {};

    if (user && !isOwnerOrAdmin && user._id) {
      leadBase.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
      const userLeads = await Lead.find(leadBase).select('_id');
      const leadIds = userLeads.map((l) => l._id);

      custBase.$or = [
        { assignedStaff: user._id },
        { 'projects.assignedStaff': user._id },
        { sourceLeadId: { $in: leadIds } },
        { leads: { $in: leadIds } },
      ];
      followUpBase.$or = [
        { assignedTo: user._id },
        { performedBy: user._id },
        { createdBy: user._id },
        { leadId: { $in: leadIds } },
      ];
      measurementBase.$or = [
        { assignedTo: user._id },
        { conductedBy: user._id },
        { leadId: { $in: leadIds } },
      ];
      quotationBase.$or = [
        { createdBy: user._id },
        { leadId: { $in: leadIds } },
      ];
    }

    const [
      totalLeads,
      newLeads,
      todaysLeads,
      todaysFollowUps,
      overdueFollowUps,
      pendingMeasurements,
      pendingQuotations,
      sentQuotations,
      wonLeads,
      lostLeads,
      activeCustomers,
    ] = await Promise.all([
      Lead.countDocuments(leadBase),
      Lead.countDocuments({ ...leadBase, status: 'new' }),
      Lead.countDocuments({ ...leadBase, createdAt: { $gte: today, $lte: endOfToday } }),
      FollowUp.countDocuments({ ...followUpBase, scheduledAt: { $gte: today, $lte: endOfToday }, status: 'pending' }),
      FollowUp.countDocuments({ ...followUpBase, scheduledAt: { $lt: today }, status: 'pending' }),
      Measurement.countDocuments({ ...measurementBase, status: { $in: ['pending', 'scheduled'] } }),
      Quotation.countDocuments({ ...quotationBase, status: 'draft' }),
      Quotation.countDocuments({ ...quotationBase, status: 'sent' }),
      Lead.countDocuments({ ...leadBase, status: 'won' }),
      Lead.countDocuments({ ...leadBase, status: 'lost' }),
      Customer.countDocuments(custBase),
    ]);

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        todaysLeads,
        todaysFollowUps,
        overdueFollowUps,
        pendingMeasurements,
        pendingQuotations,
        sentQuotations,
        wonLeads,
        lostLeads,
        activeCustomers,
        conversionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

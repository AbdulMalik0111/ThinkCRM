import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Measurement } from '../models/Measurement.js';
import { Quotation } from '../models/Quotation.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

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
    ] = await Promise.all([
      Lead.countDocuments({ isDeleted: false }),
      Lead.countDocuments({ status: 'new', isDeleted: false }),
      Lead.countDocuments({ createdAt: { $gte: today, $lte: endOfToday }, isDeleted: false }),
      FollowUp.countDocuments({ scheduledAt: { $gte: today, $lte: endOfToday }, status: 'pending' }),
      FollowUp.countDocuments({ scheduledAt: { $lt: today }, status: 'pending' }),
      Measurement.countDocuments({ status: { $in: ['pending', 'scheduled'] } }),
      Quotation.countDocuments({ status: 'draft' }),
      Quotation.countDocuments({ status: 'sent' }),
      Lead.countDocuments({ status: 'won', isDeleted: false }),
      Lead.countDocuments({ status: 'lost', isDeleted: false }),
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
        conversionRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

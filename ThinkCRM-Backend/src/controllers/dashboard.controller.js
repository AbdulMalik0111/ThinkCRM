import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Measurement } from '../models/Measurement.js';
import { Quotation } from '../models/Quotation.js';
import { Customer } from '../models/Customer.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Dynamic date range handling
    const { range, startDate, endDate } = req.query;
    let rangeFilter = null;
    let durationMs = 30 * 24 * 60 * 60 * 1000; // default 30 days window for trend comparison

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      rangeFilter = { $gte: start, $lte: end };
      durationMs = Math.max(end.getTime() - start.getTime(), 86400000);
    } else if (range && range !== 'all' && range !== 'All Time' && range !== 'Date Range') {
      const rLower = range.toLowerCase().replace(/[\s-]/g, '_');
      if (rLower === 'today') {
        rangeFilter = { $gte: today, $lte: endOfToday };
        durationMs = 86400000;
      } else if (rLower === 'last_7_days' || rLower === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        rangeFilter = { $gte: start, $lte: now };
        durationMs = 7 * 86400000;
      } else if (rLower === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        rangeFilter = { $gte: start, $lte: end };
        durationMs = end.getTime() - start.getTime();
      } else if (rLower === 'this_quarter') {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
        rangeFilter = { $gte: start, $lte: end };
        durationMs = end.getTime() - start.getTime();
      } else if (rLower === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        rangeFilter = { $gte: start, $lte: end };
        durationMs = end.getTime() - start.getTime();
      }
    }

    // Previous window for real dynamic trend calculation
    const currentEnd = rangeFilter?.$lte || now;
    const currentStart = rangeFilter?.$gte || new Date(currentEnd.getTime() - durationMs);
    const prevStart = new Date(currentStart.getTime() - durationMs);
    const prevEnd = new Date(currentStart.getTime() - 1);

    const leadBase = { isDeleted: false };
    const custBase = { deletedAt: null };
    const followUpBase = {};
    const measurementBase = {};
    const quotationBase = {};

    if (user && !isOwnerOrAdmin && user._id) {
      const uId = mongoose.Types.ObjectId.isValid(user._id)
        ? new mongoose.Types.ObjectId(user._id)
        : user._id;

      leadBase.$or = [{ assignedTo: uId }, { createdBy: uId }];
      const userLeads = await Lead.find(leadBase).select('_id');
      const leadIds = userLeads.map((l) => l._id);

      custBase.$or = [
        { assignedStaff: uId },
        { 'projects.assignedStaff': uId },
        { sourceLeadId: { $in: leadIds } },
        { leads: { $in: leadIds } },
      ];
      followUpBase.$or = [
        { assignedTo: uId },
        { performedBy: uId },
        { createdBy: uId },
        { leadId: { $in: leadIds } },
      ];
      measurementBase.$or = [
        { assignedTo: uId },
        { conductedBy: uId },
        { leadId: { $in: leadIds } },
      ];
      quotationBase.$or = [
        { createdBy: uId },
        { leadId: { $in: leadIds } },
      ];
    }

    const leadQuery = rangeFilter ? { ...leadBase, createdAt: rangeFilter } : leadBase;
    const custQuery = rangeFilter ? { ...custBase, createdAt: rangeFilter } : custBase;
    const quotationQuery = rangeFilter ? { ...quotationBase, createdAt: rangeFilter } : quotationBase;
    const measurementQuery = rangeFilter ? { ...measurementBase, createdAt: rangeFilter } : measurementBase;

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
      prevTotalLeads,
      prevNewLeads,
      prevWonLeads,
      prevLostLeads,
    ] = await Promise.all([
      Lead.countDocuments(leadQuery),
      Lead.countDocuments({ ...leadQuery, status: 'new' }),
      Lead.countDocuments({ ...leadBase, createdAt: { $gte: today, $lte: endOfToday } }),
      FollowUp.countDocuments({ ...followUpBase, scheduledAt: { $gte: today, $lte: endOfToday }, status: 'pending' }),
      FollowUp.countDocuments({ ...followUpBase, scheduledAt: { $lt: today }, status: 'pending' }),
      Measurement.countDocuments({ ...measurementQuery, status: { $in: ['pending', 'scheduled'] } }),
      Quotation.countDocuments({ ...quotationQuery, status: 'draft' }),
      Quotation.countDocuments({ ...quotationQuery, status: 'sent' }),
      Lead.countDocuments({ ...leadQuery, status: 'won' }),
      Lead.countDocuments({ ...leadQuery, status: 'lost' }),
      Customer.countDocuments(custQuery),
      Lead.countDocuments({ ...leadBase, createdAt: { $gte: prevStart, $lte: prevEnd } }),
      Lead.countDocuments({ ...leadBase, status: 'new', createdAt: { $gte: prevStart, $lte: prevEnd } }),
      Lead.countDocuments({ ...leadBase, status: 'won', createdAt: { $gte: prevStart, $lte: prevEnd } }),
      Lead.countDocuments({ ...leadBase, status: 'lost', createdAt: { $gte: prevStart, $lte: prevEnd } }),
    ]);

    const conversionRate = totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;
    const prevConversionRate = prevTotalLeads > 0 ? Number(((prevWonLeads / prevTotalLeads) * 100).toFixed(1)) : 0;

    const calcTrend = (curr, prev) => {
      if (!prev || prev === 0) {
        return {
          value: curr > 0 ? '+100%' : '0%',
          isPositive: curr >= prev,
        };
      }
      const diff = Math.round(((curr - prev) / prev) * 100);
      return {
        value: `${diff >= 0 ? '+' : ''}${diff}%`,
        isPositive: diff >= 0,
      };
    };

    const trends = {
      totalLeads: calcTrend(totalLeads, prevTotalLeads),
      newLeads: calcTrend(newLeads, prevNewLeads),
      wonLeads: calcTrend(wonLeads, prevWonLeads),
      lostLeads: {
        ...calcTrend(lostLeads, prevLostLeads),
        isPositive: lostLeads <= prevLostLeads, // fewer lost leads is positive
      },
      conversionRate: {
        value: `${conversionRate >= prevConversionRate ? '+' : ''}${(conversionRate - prevConversionRate).toFixed(1)}%`,
        isPositive: conversionRate >= prevConversionRate,
      },
    };

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
        trends,
      },
    });
  } catch (error) {
    next(error);
  }
};

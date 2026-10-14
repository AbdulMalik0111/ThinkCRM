import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Quotation } from '../models/Quotation.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';

// Status color palette & human labels
export const STATUS_META = {
  new: { label: 'New', color: '#3b82f6' },
  contacted: { label: 'Contacted', color: '#06b6d4' },
  qualified: { label: 'Qualified', color: '#f97316' },
  follow_up: { label: 'Follow-up', color: '#2563eb' },
  measurement_pending: { label: 'Measurement', color: '#8b5cf6' },
  measurement_scheduled: { label: 'Measurement', color: '#8b5cf6' },
  measurement_completed: { label: 'Measurement', color: '#8b5cf6' },
  quotation_pending: { label: 'Quotation', color: '#6366f1' },
  quotation_sent: { label: 'Quotation', color: '#6366f1' },
  negotiation: { label: 'Negotiation', color: '#d946ef' },
  won: { label: 'Won', color: '#10b981' },
  lost: { label: 'Lost', color: '#ef4444' },
  junk: { label: 'Junk', color: '#64748b' },
};

// Calculate percentage change with safe zero division
export const calcPercentageChange = (current = 0, previous = 0) => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const diff = ((current - previous) / previous) * 100;
  return Number(diff.toFixed(1));
};

export const getAnalyticsOverview = async (query = {}) => {
  const now = new Date();

  // Date Parsing: default to current month or provided range
  let startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  let endDate = query.endDate
    ? new Date(query.endDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Fallback if invalid date
  if (isNaN(startDate.getTime())) startDate = new Date(now.getFullYear(), 0, 1);
  if (isNaN(endDate.getTime())) endDate = now;

  // Compute Comparison Window
  const durationMs = Math.max(endDate.getTime() - startDate.getTime(), 86400000);
  const prevStartDate = new Date(startDate.getTime() - durationMs);
  const prevEndDate = new Date(startDate.getTime() - 1);

  // Common Filter Builder
  const buildMatch = (start, end) => {
    const match = {
      isDeleted: false,
    };

    if (start && end) {
      match.createdAt = { $gte: start, $lte: end };
    }

    if (query.assignedStaff && query.assignedStaff !== 'all' && mongoose.Types.ObjectId.isValid(query.assignedStaff)) {
      match.assignedTo = new mongoose.Types.ObjectId(query.assignedStaff);
    }

    if (query.source && query.source !== 'all') {
      match.leadSource = query.source;
    }

    if (query.status && query.status !== 'all') {
      match.status = query.status;
    }

    if (query.projectType && query.projectType !== 'all') {
      match.projectType = query.projectType;
    }

    if (query.city && query.city !== 'all') {
      match.$or = [
        { city: { $regex: query.city, $options: 'i' } },
        { location: { $regex: query.city, $options: 'i' } },
      ];
    }

    return match;
  };

  const currentMatch = buildMatch(startDate, endDate);
  const prevMatch = buildMatch(prevStartDate, prevEndDate);

  // 1. Current Period KPIs
  const [
    totalLeads,
    qualifiedLeads,
    wonDeals,
    wonRevenueAgg,
    prevTotalLeads,
    prevQualifiedLeads,
    prevWonDeals,
    prevWonRevenueAgg,
  ] = await Promise.all([
    Lead.countDocuments(currentMatch),
    Lead.countDocuments({ ...currentMatch, status: 'qualified' }),
    Lead.countDocuments({ ...currentMatch, status: 'won' }),
    Lead.aggregate([
      { $match: { ...currentMatch, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]),
    Lead.countDocuments(prevMatch),
    Lead.countDocuments({ ...prevMatch, status: 'qualified' }),
    Lead.countDocuments({ ...prevMatch, status: 'won' }),
    Lead.aggregate([
      { $match: { ...prevMatch, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$budget' } } },
    ]),
  ]);

  const currentRevenue = wonRevenueAgg[0]?.total || 0;
  const prevRevenue = prevWonRevenueAgg[0]?.total || 0;

  const kpis = {
    totalLeads: {
      value: totalLeads,
      previousValue: prevTotalLeads,
      changePercent: calcPercentageChange(totalLeads, prevTotalLeads),
      isPositive: totalLeads >= prevTotalLeads,
    },
    qualifiedLeads: {
      value: qualifiedLeads,
      previousValue: prevQualifiedLeads,
      changePercent: calcPercentageChange(qualifiedLeads, prevQualifiedLeads),
      isPositive: qualifiedLeads >= prevQualifiedLeads,
    },
    wonDeals: {
      value: wonDeals,
      previousValue: prevWonDeals,
      changePercent: calcPercentageChange(wonDeals, prevWonDeals),
      isPositive: wonDeals >= prevWonDeals,
    },
    revenue: {
      value: currentRevenue,
      previousValue: prevRevenue,
      changePercent: calcPercentageChange(currentRevenue, prevRevenue),
      isPositive: currentRevenue >= prevRevenue,
    },
  };

  // 2. Lead & Revenue Trend Series
  const grouping = query.grouping || 'monthly'; // 'monthly', 'weekly', 'daily'
  let trendCategories = [];
  let trendLeads = [];
  let trendRevenue = [];

  if (grouping === 'monthly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    trendCategories = months;

    const [monthlyLeads, monthlyRevenue] = await Promise.all([
      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: {
              $gte: new Date(startDate.getFullYear(), 0, 1),
              $lte: new Date(startDate.getFullYear(), 11, 31, 23, 59, 59),
            },
            ...(query.assignedStaff && query.assignedStaff !== 'all'
              ? { assignedTo: new mongoose.Types.ObjectId(query.assignedStaff) }
              : {}),
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
          },
        },
      ]),
      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            status: 'won',
            createdAt: {
              $gte: new Date(startDate.getFullYear(), 0, 1),
              $lte: new Date(startDate.getFullYear(), 11, 31, 23, 59, 59),
            },
            ...(query.assignedStaff && query.assignedStaff !== 'all'
              ? { assignedTo: new mongoose.Types.ObjectId(query.assignedStaff) }
              : {}),
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: '$budget' },
          },
        },
      ]),
    ]);

    const leadMap = {};
    monthlyLeads.forEach((m) => {
      leadMap[m._id] = m.count;
    });

    const revenueMap = {};
    monthlyRevenue.forEach((m) => {
      revenueMap[m._id] = m.revenue;
    });

    for (let i = 1; i <= 12; i++) {
      trendLeads.push(leadMap[i] || 0);
      trendRevenue.push(revenueMap[i] || 0);
    }
  } else if (grouping === 'weekly') {
    trendCategories = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    // 5 weekly buckets for current period
    const bucketLength = durationMs / 5;
    for (let i = 0; i < 5; i++) {
      const bStart = new Date(startDate.getTime() + i * bucketLength);
      const bEnd = new Date(startDate.getTime() + (i + 1) * bucketLength);

      const [wLeads, wRev] = await Promise.all([
        Lead.countDocuments({ ...currentMatch, createdAt: { $gte: bStart, $lte: bEnd } }),
        Lead.aggregate([
          { $match: { ...currentMatch, status: 'won', createdAt: { $gte: bStart, $lte: bEnd } } },
          { $group: { _id: null, total: { $sum: '$budget' } } },
        ]),
      ]);

      trendLeads.push(wLeads);
      trendRevenue.push(wRev[0]?.total || 0);
    }
  } else if (grouping === 'daily') {
    // Days in current range (up to 31)
    const daysCount = Math.min(Math.ceil(durationMs / 86400000), 31);
    for (let d = 0; d < daysCount; d++) {
      const dStart = new Date(startDate.getTime() + d * 86400000);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(dStart);
      dEnd.setHours(23, 59, 59, 999);

      trendCategories.push(
        dStart.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
      );

      const [dLeads, dRev] = await Promise.all([
        Lead.countDocuments({ ...currentMatch, createdAt: { $gte: dStart, $lte: dEnd } }),
        Lead.aggregate([
          { $match: { ...currentMatch, status: 'won', createdAt: { $gte: dStart, $lte: dEnd } } },
          { $group: { _id: null, total: { $sum: '$budget' } } },
        ]),
      ]);

      trendLeads.push(dLeads);
      trendRevenue.push(dRev[0]?.total || 0);
    }
  }

  // 3. Lead Status Distribution
  const rawStatusDistribution = await Lead.aggregate([
    { $match: currentMatch },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const totalStatusLeads = rawStatusDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const statusDistribution = rawStatusDistribution.map((item) => {
    const meta = STATUS_META[item._id] || { label: item._id, color: '#94a3b8' };
    return {
      status: item._id,
      label: meta.label,
      color: meta.color,
      count: item.count,
      percentage: Number(((item.count / totalStatusLeads) * 100).toFixed(1)),
    };
  });

  // 4. Lead Sources Breakdown
  const rawSources = await Lead.aggregate([
    { $match: currentMatch },
    { $group: { _id: '$leadSource', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const totalSourceLeads = rawSources.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const sourceBreakdown = rawSources.map((item) => ({
    source: item._id || 'Other',
    count: item.count,
    percentage: Number(((item.count / totalSourceLeads) * 100).toFixed(1)),
  }));

  // 5. Sales Team Performance
  const staffPerfAgg = await Lead.aggregate([
    { $match: { isDeleted: false, assignedTo: { $ne: null } } },
    {
      $group: {
        _id: '$assignedTo',
        assigned: { $sum: 1 },
        qualified: {
          $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] },
        },
        won: {
          $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
        },
        revenue: {
          $sum: {
            $cond: [{ $eq: ['$status', 'won'] }, { $ifNull: ['$budget', 0] }, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
        email: '$user.email',
        avatar: '$user.avatar',
        assigned: 1,
        qualified: 1,
        won: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1, won: -1 } },
  ]);

  const salesTeamPerformance = staffPerfAgg.map((s) => ({
    staffId: s._id,
    name: s.name.trim() || s.email,
    email: s.email,
    avatar: s.avatar,
    assigned: s.assigned,
    qualified: s.qualified,
    won: s.won,
    conversion: s.assigned > 0 ? Number(((s.won / s.assigned) * 100).toFixed(1)) : 0,
    revenue: s.revenue,
  }));

  // 6. Follow-up Overview (Due Today, Overdue, Completed)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const followUpMatch = {};
  if (query.assignedStaff && query.assignedStaff !== 'all' && mongoose.Types.ObjectId.isValid(query.assignedStaff)) {
    followUpMatch.assignedTo = new mongoose.Types.ObjectId(query.assignedStaff);
  }

  const [dueTodayCount, overdueCount, completedCount] = await Promise.all([
    FollowUp.countDocuments({
      ...followUpMatch,
      scheduledAt: { $gte: todayStart, $lte: todayEnd },
      status: 'pending',
    }),
    FollowUp.countDocuments({
      ...followUpMatch,
      scheduledAt: { $lt: todayStart },
      status: 'pending',
    }),
    FollowUp.countDocuments({
      ...followUpMatch,
      completedAt: { $gte: startDate, $lte: endDate },
      status: 'completed',
    }),
  ]);

  const followUpsOverview = {
    dueToday: {
      count: dueTodayCount,
      changePercent: 28,
      isPositive: true,
      description: 'Follow-ups scheduled for today',
    },
    overdue: {
      count: overdueCount,
      changePercent: 50,
      isPositive: false,
      description: 'Follow-ups past due date',
    },
    completed: {
      count: completedCount,
      changePercent: 18,
      isPositive: true,
      description: 'Follow-ups completed in this period',
    },
  };

  return {
    kpis,
    trend: {
      grouping,
      categories: trendCategories,
      leads: trendLeads,
      revenue: trendRevenue,
    },
    statusDistribution,
    sourceBreakdown,
    salesTeamPerformance,
    followUpsOverview,
    filterMeta: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      grouping,
      comparison: query.comparison || 'previous_period',
    },
  };
};

export const getExportRecords = async (query = {}) => {
  const now = new Date();
  let startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), 0, 1);
  let endDate = query.endDate ? new Date(query.endDate) : now;

  const match = { isDeleted: false };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  if (query.assignedStaff && query.assignedStaff !== 'all' && mongoose.Types.ObjectId.isValid(query.assignedStaff)) {
    match.assignedTo = new mongoose.Types.ObjectId(query.assignedStaff);
  }
  if (query.source && query.source !== 'all') {
    match.leadSource = query.source;
  }
  if (query.status && query.status !== 'all') {
    match.status = query.status;
  }
  if (query.projectType && query.projectType !== 'all') {
    match.projectType = query.projectType;
  }
  if (query.city && query.city !== 'all') {
    match.$or = [
      { city: { $regex: query.city, $options: 'i' } },
      { location: { $regex: query.city, $options: 'i' } },
    ];
  }

  const leads = await Lead.find(match)
    .populate('assignedTo', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(5000);

  return leads.map((l) => ({
    leadId: l.leadId || `LEAD-${l._id?.toString().slice(-6).toUpperCase()}`,
    fullName: l.fullName,
    phone: l.phone,
    email: l.email || '',
    leadSource: l.leadSource,
    status: l.status,
    projectType: l.projectType,
    budget: l.budget || 0,
    assignedStaff: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}`.trim() : 'Unassigned',
    city: l.city || l.location || '',
    createdAt: l.createdAt ? l.createdAt.toISOString() : '',
  }));
};

export const getDetailedRecords = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const now = new Date();
  let startDate = query.startDate ? new Date(query.startDate) : new Date(now.getFullYear(), 0, 1);
  let endDate = query.endDate ? new Date(query.endDate) : now;

  const match = { isDeleted: false };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  if (query.assignedStaff && query.assignedStaff !== 'all' && mongoose.Types.ObjectId.isValid(query.assignedStaff)) {
    match.assignedTo = new mongoose.Types.ObjectId(query.assignedStaff);
  }
  if (query.source && query.source !== 'all') {
    match.leadSource = query.source;
  }
  if (query.status && query.status !== 'all') {
    match.status = query.status;
  }
  if (query.projectType && query.projectType !== 'all') {
    match.projectType = query.projectType;
  }
  if (query.city && query.city !== 'all') {
    match.$or = [
      { city: { $regex: query.city, $options: 'i' } },
      { location: { $regex: query.city, $options: 'i' } },
    ];
  }
  if (query.search) {
    match.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { leadId: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [total, records] = await Promise.all([
    Lead.countDocuments(match),
    Lead.find(match)
      .populate('assignedTo', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    records: records.map((l) => ({
      _id: l._id,
      leadId: l.leadId || `LEAD-${l._id?.toString().slice(-6).toUpperCase()}`,
      fullName: l.fullName,
      phone: l.phone,
      email: l.email || '',
      leadSource: l.leadSource,
      status: l.status,
      projectType: l.projectType,
      budget: l.budget || 0,
      assignedStaff: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}`.trim() : 'Unassigned',
      city: l.city || l.location || '',
      createdAt: l.createdAt ? l.createdAt.toISOString() : '',
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

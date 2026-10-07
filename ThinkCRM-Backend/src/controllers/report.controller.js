import { Lead } from '../models/Lead.js';
import { FollowUp } from '../models/FollowUp.js';
import { Quotation } from '../models/Quotation.js';

export const getLeadReports = async (req, res, next) => {
  try {
    const leadsBySource = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$leadSource', count: { $sum: 1 } } }
    ]);

    const leadsByStatus = await Lead.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        leadsBySource,
        leadsByStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesReports = async (req, res, next) => {
  try {
    const [wonLeads, lostLeads, quotationStats] = await Promise.all([
      Lead.countDocuments({ status: 'won', isDeleted: false }),
      Lead.countDocuments({ status: 'lost', isDeleted: false }),
      Quotation.aggregate([
        { $match: { status: { $in: ['sent', 'accepted'] } } },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        wonLeads,
        lostLeads,
        totalQuotationValue: quotationStats[0]?.totalAmount || 0,
        quotationCount: quotationStats[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStaffReports = async (req, res, next) => {
  try {
    const staffPerformance = await Lead.aggregate([
      { $match: { isDeleted: false, assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $project: {
          name: { $concat: ['$staff.firstName', ' ', '$staff.lastName'] },
          totalAssigned: 1,
          won: 1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { staffPerformance },
    });
  } catch (error) {
    next(error);
  }
};

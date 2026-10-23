import mongoose from 'mongoose';
import * as reportService from '../services/report.service.js';
import { Lead } from '../models/Lead.js';
import { Quotation } from '../models/Quotation.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const data = await reportService.getAnalyticsOverview(req.query, req.user);
    res.status(200).json({
      success: true,
      message: 'Analytics overview fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailedRecords = async (req, res, next) => {
  try {
    const data = await reportService.getDetailedRecords(req.query, req.user);
    res.status(200).json({
      success: true,
      message: 'Detailed report records fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const records = await reportService.getExportRecords(req.query, req.user);

    if (format === 'csv') {
      const headers = [
        'Lead ID',
        'Full Name',
        'Phone',
        'Email',
        'Lead Source',
        'Status',
        'Project Type',
        'Budget (INR)',
        'Assigned Staff',
        'City',
        'Created Date',
      ];

      const csvRows = records.map((r) => [
        `"${r.leadId}"`,
        `"${r.fullName}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${r.leadSource}"`,
        `"${r.status}"`,
        `"${r.projectType}"`,
        `"${r.budget}"`,
        `"${r.assignedStaff}"`,
        `"${r.city}"`,
        `"${r.createdAt}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="thinkcrm-analytics-report-${new Date().toISOString().slice(0, 10)}.csv"`
      );
      return res.status(200).send(csvContent);
    }

    if (format === 'excel' || format === 'xlsx') {
      const headers = [
        'Lead ID',
        'Full Name',
        'Phone',
        'Email',
        'Lead Source',
        'Status',
        'Project Type',
        'Budget (INR)',
        'Assigned Staff',
        'City',
        'Created Date',
      ];

      const xmlRows = records.map((r) => `
        <Row>
          <Cell><Data ss:Type="String">${r.leadId || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.fullName || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.phone || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.email || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.leadSource || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.status || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.projectType || ''}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.budget || 0}</Data></Cell>
          <Cell><Data ss:Type="String">${r.assignedStaff || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.city || ''}</Data></Cell>
          <Cell><Data ss:Type="String">${r.createdAt || ''}</Data></Cell>
        </Row>`).join('');

      const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="HeaderStyle">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#10B981" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Leads Report">
    <Table>
      <Row ss:StyleID="HeaderStyle">
        ${headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}
      </Row>
      ${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

      res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="thinkcrm-analytics-report-${new Date().toISOString().slice(0, 10)}.xlsx"`
      );
      return res.status(200).send(xmlContent);
    }

    // JSON payload for frontend PDF and XLSX generators
    res.status(200).json({
      success: true,
      message: 'Report export data generated',
      data: {
        records,
        count: records.length,
      },
    });
  } catch (error) {
    next(error);
  }
};



export const getLeadReports = async (req, res, next) => {
  try {
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

    const match = { isDeleted: false };
    if (user && !isOwnerOrAdmin && user._id) {
      const uId = mongoose.Types.ObjectId.isValid(user._id)
        ? new mongoose.Types.ObjectId(user._id)
        : user._id;
      match.$or = [{ assignedTo: uId }, { createdBy: uId }];
    }

    // Dynamic date range filtering
    const { range, startDate, endDate } = req.query;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      match.createdAt = { $gte: start, $lte: end };
    } else if (range && range !== 'all' && range !== 'All Time' && range !== 'Date Range') {
      const now = new Date();
      const rLower = range.toLowerCase().replace(/[\s-]/g, '_');
      if (rLower === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        match.createdAt = { $gte: start, $lte: end };
      } else if (rLower === 'last_7_days' || rLower === '7d') {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        match.createdAt = { $gte: start, $lte: now };
      } else if (rLower === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        match.createdAt = { $gte: start, $lte: end };
      } else if (rLower === 'this_quarter') {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
        match.createdAt = { $gte: start, $lte: end };
      } else if (rLower === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        match.createdAt = { $gte: start, $lte: end };
      }
    }

    const leadsBySource = await Lead.aggregate([
      { $match: match },
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
    ]);

    const leadsByStatus = await Lead.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
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
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

    const leadMatch = { isDeleted: false };
    const quotationMatch = { status: { $in: ['sent', 'accepted'] } };

    if (user && !isOwnerOrAdmin && user._id) {
      const uId = mongoose.Types.ObjectId.isValid(user._id)
        ? new mongoose.Types.ObjectId(user._id)
        : user._id;
      leadMatch.$or = [{ assignedTo: uId }, { createdBy: uId }];
      const userLeads = await Lead.find(leadMatch).select('_id');
      const leadIds = userLeads.map((l) => l._id);
      quotationMatch.$or = [
        { createdBy: uId },
        { leadId: { $in: leadIds } },
      ];
    }

    const [wonLeads, lostLeads, quotationStats] = await Promise.all([
      Lead.countDocuments({ ...leadMatch, status: 'won' }),
      Lead.countDocuments({ ...leadMatch, status: 'lost' }),
      Quotation.aggregate([
        { $match: quotationMatch },
        { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
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
    const user = req.user;
    const isOwnerOrAdmin = user && (user.role === 'Owner' || user.role === 'Admin');

    const matchStaff = { isDeleted: false, assignedTo: { $ne: null } };
    if (user && !isOwnerOrAdmin && user._id) {
      const uId = mongoose.Types.ObjectId.isValid(user._id)
        ? new mongoose.Types.ObjectId(user._id)
        : user._id;
      matchStaff.assignedTo = uId;
    }

    const staffPerformance = await Lead.aggregate([
      { $match: matchStaff },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          won: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff',
        },
      },
      { $unwind: '$staff' },
      {
        $project: {
          name: { $concat: ['$staff.firstName', ' ', '$staff.lastName'] },
          totalAssigned: 1,
          won: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: { staffPerformance },
    });
  } catch (error) {
    next(error);
  }
};

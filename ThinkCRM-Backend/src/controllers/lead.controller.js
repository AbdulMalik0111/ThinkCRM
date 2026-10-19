import * as leadService from '../services/lead.service.js';
import * as activityService from '../services/activity.service.js';

export const getLeadStats = async (req, res, next) => {
  try {
    const stats = await leadService.getLeadStats();
    res.status(200).json({
      success: true,
      message: 'Lead statistics fetched successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const lead = await leadService.createLead(req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req, res, next) => {
  try {
    const data = await leadService.getLeads(req.query);
    res.status(200).json({
      success: true,
      message: 'Leads fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lead fetched successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const assignLead = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const lead = await leadService.assignLead(req.params.id, assignedTo, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lead assigned successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadActivities = async (req, res, next) => {
  try {
    const activities = await activityService.getLeadActivities(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lead activities fetched successfully',
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
};

export const convertLeadToCustomer = async (req, res, next) => {
  try {
    const result = await leadService.convertLeadToCustomer(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lead converted to customer successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addLeadNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const lead = await leadService.addLeadNote(req.params.id, content, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAssign = async (req, res, next) => {
  try {
    const { leadIds, assignedTo } = req.body;
    await leadService.bulkAssignLeads(leadIds, assignedTo, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Leads assigned successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { leadIds, status } = req.body;
    await leadService.bulkUpdateStatus(leadIds, status, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lead statuses updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDelete = async (req, res, next) => {
  try {
    const { leadIds } = req.body;
    await leadService.bulkDeleteLeads(leadIds, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Leads deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendLeadEmail = async (req, res, next) => {
  try {
    const result = await leadService.sendLeadEmail(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const addLeadDocument = async (req, res, next) => {
  try {
    const documents = await leadService.addLeadDocument(req.params.id, req.body, req.file, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadDocument = async (req, res, next) => {
  try {
    const documents = await leadService.deleteLeadDocument(req.params.id, req.params.docId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

export const importLeads = async (req, res, next) => {
  try {
    const leads = req.body.leads || req.body;
    const duplicatePolicy = req.body.duplicatePolicy || 'skip';
    const result = await leadService.importLeads(leads, req.user._id, duplicatePolicy);
    res.status(200).json({
      success: true,
      message: `Lead import processed: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};



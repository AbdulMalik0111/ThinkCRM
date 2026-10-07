import * as leadService from '../services/lead.service.js';
import * as activityService from '../services/activity.service.js';

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

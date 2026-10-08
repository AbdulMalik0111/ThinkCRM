import * as followupService from '../services/followup.service.js';

export const createFollowUp = async (req, res, next) => {
  try {
    const followUp = await followupService.createFollowUp(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFollowUp = async (req, res, next) => {
  try {
    const followUp = await followupService.updateFollowUp(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadFollowUps = async (req, res, next) => {
  try {
    const followUps = await followupService.getLeadFollowUps(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Follow-ups fetched successfully',
      data: { followUps },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFollowUps = async (req, res, next) => {
  try {
    const followUps = await followupService.getAllFollowUps();
    res.status(200).json({
      success: true,
      message: 'All follow-ups fetched successfully',
      data: { followUps },
    });
  } catch (error) {
    next(error);
  }
};

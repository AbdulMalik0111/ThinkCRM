import * as measurementService from '../services/measurement.service.js';

export const createMeasurement = async (req, res, next) => {
  try {
    const measurement = await measurementService.createMeasurement(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Measurement created successfully',
      data: { measurement },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeasurement = async (req, res, next) => {
  try {
    const measurement = await measurementService.updateMeasurement(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Measurement updated successfully',
      data: { measurement },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadMeasurements = async (req, res, next) => {
  try {
    const measurements = await measurementService.getLeadMeasurements(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Measurements fetched successfully',
      data: { measurements },
    });
  } catch (error) {
    next(error);
  }
};

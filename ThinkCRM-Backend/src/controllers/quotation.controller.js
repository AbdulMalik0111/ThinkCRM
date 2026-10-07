import * as quotationService from '../services/quotation.service.js';

export const createQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createQuotation(req.params.id, req.body, req.file, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const sendQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.sendQuotation(req.params.id, req.params.quotationId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Quotation sent successfully',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadQuotations = async (req, res, next) => {
  try {
    const quotations = await quotationService.getLeadQuotations(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Quotations fetched successfully',
      data: { quotations },
    });
  } catch (error) {
    next(error);
  }
};

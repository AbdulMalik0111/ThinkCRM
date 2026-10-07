import * as customerService from '../services/customer.service.js';

export const convertLeadToCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.convertLeadToCustomer(req.body.sourceLeadId, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Lead successfully converted to customer',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const data = await customerService.getCustomers(req.query);
    res.status(200).json({
      success: true,
      message: 'Customers fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer fetched successfully',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

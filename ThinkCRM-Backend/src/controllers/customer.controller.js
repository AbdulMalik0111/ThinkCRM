import * as customerService from '../services/customer.service.js';
import * as quotationService from '../services/quotation.service.js';

export const createCustomer = async (req, res, next) => {
  try {
    let customer;
    if (req.body.sourceLeadId && !req.body.fullName) {
      customer = await customerService.convertLeadToCustomer(req.body.sourceLeadId, req.user._id);
    } else {
      customer = await customerService.createCustomer(req.body, req.user._id);
    }
    res.status(201).json({
      success: true,
      message: 'Customer saved successfully',
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
    const data = await customerService.getCustomerById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const addCustomerNote = async (req, res, next) => {
  try {
    const notes = await customerService.addCustomerNote(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerNote = async (req, res, next) => {
  try {
    const notes = await customerService.updateCustomerNote(
      req.params.id,
      req.params.noteId,
      req.body,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerNote = async (req, res, next) => {
  try {
    const notes = await customerService.deleteCustomerNote(req.params.id, req.params.noteId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Note removed successfully',
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

export const addCustomerDocument = async (req, res, next) => {
  try {
    const documents = await customerService.addCustomerDocument(
      req.params.id,
      { ...req.body, file: req.file },
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: 'Document added successfully',
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerDocument = async (req, res, next) => {
  try {
    const documents = await customerService.deleteCustomerDocument(req.params.id, req.params.docId, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Document removed successfully',
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
};

export const addCustomerProject = async (req, res, next) => {
  try {
    const projects = await customerService.addCustomerProject(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomerFollowUp = async (req, res, next) => {
  try {
    const followUp = await customerService.createCustomerFollowUp(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerFollowUp = async (req, res, next) => {
  try {
    const followUp = await customerService.updateCustomerFollowUp(
      req.params.id,
      req.params.followUpId,
      req.body,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerFollowUp = async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomerFollowUp(
      req.params.id,
      req.params.followUpId,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const logCustomerCall = async (req, res, next) => {
  try {
    const activity = await customerService.logCustomerCall(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'Call logged successfully',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

export const logCustomerWhatsApp = async (req, res, next) => {
  try {
    const activity = await customerService.logCustomerWhatsApp(req.params.id, req.body, req.user._id);
    res.status(201).json({
      success: true,
      message: 'WhatsApp interaction recorded',
      data: { activity },
    });
  } catch (error) {
    next(error);
  }
};

export const sendCustomerEmail = async (req, res, next) => {
  try {
    const result = await customerService.sendCustomerEmail(req.params.id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      message: 'Email dispatched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomerQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.createCustomerQuotation(
      req.params.id,
      req.body,
      req.file,
      req.user._id
    );
    res.status(201).json({
      success: true,
      message: 'Quotation uploaded successfully',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const sendCustomerQuotation = async (req, res, next) => {
  try {
    const quotation = await quotationService.sendQuotation(
      req.params.id,
      req.params.quotationId,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: 'Quotation sent to customer successfully',
      data: { quotation },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerQuotation = async (req, res, next) => {
  try {
    const result = await quotationService.deleteQuotation(
      req.params.id,
      req.params.quotationId,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getDuplicateCustomers = async (req, res, next) => {
  try {
    const duplicates = await customerService.getDuplicateCustomers();
    res.status(200).json({
      success: true,
      message: 'Duplicate check completed',
      data: { duplicates },
    });
  } catch (error) {
    next(error);
  }
};

export const resolveDuplicateCustomers = async (req, res, next) => {
  try {
    const { primaryCustomerId, duplicateCustomerIds } = req.body;
    const result = await customerService.resolveDuplicateCustomers(
      primaryCustomerId,
      duplicateCustomerIds,
      req.user._id
    );
    res.status(200).json({
      success: true,
      message: `Successfully merged ${result.mergedCount} customer record(s)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const importCustomers = async (req, res, next) => {
  try {
    const result = await customerService.importCustomers(req.body.customers, req.user._id);
    res.status(200).json({
      success: true,
      message: `Successfully imported ${result.imported} customer(s). Skipped: ${result.skipped}, Failed: ${result.failed}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

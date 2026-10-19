import * as searchService from '../services/search.service.js';

export const getGlobalSearch = async (req, res, next) => {
  try {
    const { q = '', query = '', entity = '', limit = 8, page = 1 } = req.query;
    const searchTerm = q || query;

    const searchResult = await searchService.executeGlobalSearch({
      query: searchTerm,
      entityFilter: entity,
      limit: parseInt(limit, 10) || 8,
      page: parseInt(page, 10) || 1,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      data: searchResult,
    });
  } catch (error) {
    next(error);
  }
};

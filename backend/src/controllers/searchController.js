const SearchService = require('../services/searchService');
const { sendResponse } = require('../utils/response');

async function globalSearch(req, res, next) {
  try {
    const results = await SearchService.globalSearch(req.query.q, req.user, req.query.limit);
    sendResponse(res, true, 'OK', results);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  globalSearch,
};

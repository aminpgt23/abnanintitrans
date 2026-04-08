const Customer360Service = require('../services/customer360Service');
const { sendResponse } = require('../utils/response');

async function getCustomerOverview(req, res, next) {
  try {
    const overview = await Customer360Service.getOverview(Number(req.params.id), req.user);
    sendResponse(res, true, 'OK', overview);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getCustomerOverview,
};

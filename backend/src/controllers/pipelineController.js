const PipelineService = require('../services/pipelineService');
const { sendResponse } = require('../utils/response');

async function getStages(req, res, next) {
  try {
    const data = await PipelineService.getStages();
    sendResponse(res, true, 'OK', data);
  } catch (error) {
    next(error);
  }
}

async function getLeads(req, res, next) {
  try {
    const data = await PipelineService.getLeads(req.user, req.query);
    sendResponse(res, true, 'OK', data);
  } catch (error) {
    next(error);
  }
}

async function createLead(req, res, next) {
  try {
    const data = await PipelineService.createLead(req.body, req.user);
    sendResponse(res, true, 'Lead berhasil dibuat', data, 201);
  } catch (error) {
    next(error);
  }
}

async function getDealsBoard(req, res, next) {
  try {
    const data = await PipelineService.getDealsBoard(req.user, req.query);
    sendResponse(res, true, 'OK', data);
  } catch (error) {
    next(error);
  }
}

async function createDeal(req, res, next) {
  try {
    const data = await PipelineService.createDeal(req.body, req.user);
    sendResponse(res, true, 'Deal berhasil dibuat', data, 201);
  } catch (error) {
    next(error);
  }
}

async function updateDealStage(req, res, next) {
  try {
    const data = await PipelineService.updateDealStage(Number(req.params.id), Number(req.body.pipeline_stage_id), req.user);
    sendResponse(res, true, 'Stage deal diperbarui', data);
  } catch (error) {
    next(error);
  }
}

async function convertLeadToDeal(req, res, next) {
  try {
    const data = await PipelineService.convertLeadToDeal(Number(req.params.id), req.body, req.user);
    sendResponse(res, true, 'Lead berhasil dikonversi menjadi deal', data, 201);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStages,
  getLeads,
  createLead,
  getDealsBoard,
  createDeal,
  updateDealStage,
  convertLeadToDeal,
};

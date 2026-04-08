const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const {
  getStages,
  getLeads,
  createLead,
  getDealsBoard,
  createDeal,
  updateDealStage,
  convertLeadToDeal,
} = require('../../controllers/pipelineController');

const router = express.Router();

router.get('/stages', authenticate, getStages);
router.get('/leads', authenticate, getLeads);
router.post('/leads', authenticate, createLead);
router.post('/leads/:id/convert', authenticate, convertLeadToDeal);
router.get('/deals', authenticate, getDealsBoard);
router.post('/deals', authenticate, createDeal);
router.put('/deals/:id/stage', authenticate, updateDealStage);

module.exports = router;

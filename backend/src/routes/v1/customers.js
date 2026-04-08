const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { getCustomerOverview } = require('../../controllers/customer360Controller');

const router = express.Router();

router.get('/:id/overview', authenticate, getCustomerOverview);

module.exports = router;

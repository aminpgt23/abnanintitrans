const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { globalSearch } = require('../../controllers/searchController');

const router = express.Router();

router.get('/', authenticate, globalSearch);

module.exports = router;

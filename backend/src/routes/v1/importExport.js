const express = require('express');
const multer = require('multer');
const { authenticate } = require('../../middlewares/auth');
const {
  exportModule,
  previewCustomerImport,
  commitCustomerImport,
} = require('../../controllers/importExportController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/export/:module', authenticate, exportModule);
router.post('/import/customers/preview', authenticate, upload.single('file'), previewCustomerImport);
router.post('/import/customers/commit', authenticate, commitCustomerImport);

module.exports = router;

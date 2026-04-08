const ImportExportService = require('../services/importExportService');
const { sendResponse } = require('../utils/response');

async function exportModule(req, res, next) {
  try {
    const format = req.query.format || 'csv';
    const exported = await ImportExportService.exportModule(req.params.module, format, req.user, req.query);
    res.setHeader('Content-Type', exported.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
    res.send(exported.buffer);
  } catch (error) {
    next(error);
  }
}

async function previewCustomerImport(req, res, next) {
  try {
    const preview = await ImportExportService.saveCustomerImportPreview(req.file, req.user);
    sendResponse(res, true, 'Preview import berhasil dibuat', preview);
  } catch (error) {
    next(error);
  }
}

async function commitCustomerImport(req, res, next) {
  try {
    const result = await ImportExportService.commitCustomerImport(Number(req.body.import_job_id));
    sendResponse(res, true, 'Import customer berhasil dijalankan', result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  exportModule,
  previewCustomerImport,
  commitCustomerImport,
};

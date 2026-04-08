const express = require('express');
const customersV1Router = require('./customers');
const importExportV1Router = require('./importExport');
const pipelineV1Router = require('./pipeline');
const searchV1Router = require('./search');

const v1Router = express.Router();

v1Router.use('/customers', customersV1Router);
v1Router.use('/', importExportV1Router);
v1Router.use('/pipeline', pipelineV1Router);
v1Router.use('/search', searchV1Router);

module.exports = {
  v1Router,
};

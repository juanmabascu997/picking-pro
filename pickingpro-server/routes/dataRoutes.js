const express = require('express');
const { getDashboardData, getTransactionsData, getTransactionsDataByDate, getJobStatus, getJobDownload } = require('../controllers/dataControllers');
const router = express.Router();

router.get('/', (req, res) => res.json({message: "Inicio de API Data"}));

router.get('/dashboard-data', getDashboardData);

router.get('/today-data', getTransactionsData);

router.get('/data-peer-date', getTransactionsDataByDate);

router.get('/job-status/:jobId', getJobStatus);

router.get('/job-download/:jobId', getJobDownload);


module.exports = router;
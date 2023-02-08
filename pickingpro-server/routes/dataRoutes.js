const express = require('express');
const { getDashboardData } = require('../controllers/dataControllers');
const router = express.Router();

router.get('/', (req, res) => res.json({message: "Inicio de API Data"}));

router.get('/dashboard-data', getDashboardData);

module.exports = router;
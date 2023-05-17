const express = require('express');
const { getPedidosFromId, getDuplicates, clearDuplicates } = require('../controllers/testControllers');
const router = express.Router();

router.get('/get-pedidos-from-id', getPedidosFromId);

router.get('/get-duplicates', getDuplicates)

router.get('/clear-duplicates', clearDuplicates)

module.exports = router;
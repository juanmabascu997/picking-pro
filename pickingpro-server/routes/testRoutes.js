const express = require('express');
const { getPedidosFromId, getDuplicates } = require('../controllers/testControllers');
const router = express.Router();

router.get('/get-pedidos-from-id', getPedidosFromId);

router.get('/get-duplicates', getDuplicates)

module.exports = router;
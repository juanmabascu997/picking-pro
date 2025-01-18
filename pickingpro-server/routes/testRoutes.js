const express = await import('express');
const { getPedidosFromId, getDuplicates, clearDuplicates } = await import('../controllers/testControllers');
const router = express.Router();

router.get('/get-pedidos-from-id', getPedidosFromId);

router.get('/get-duplicates', getDuplicates)

router.get('/clear-duplicates', clearDuplicates)

module.exports = router;
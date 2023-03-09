const express = require('express');
const router = express.Router();
const { getLabelToPrint, connectTiendanube, getConnectedStores, handleWebhook, getProductsToPick, setProductsPicked, getProductsToPack, reportProblem, packOrder, getOrdersWithProblem, solveProblem, getOrdersToShip } = require("../controllers/integrationControllers");

router.get('/', (req, res) => res.json({message: "Inicio de API"}));

router.get('/connect', connectTiendanube);

router.get('/connected-stores', getConnectedStores);

router.get('/picking-products', getProductsToPick);

router.get('/set-picked-products', setProductsPicked);

router.get('/packing-products', getProductsToPack);

router.get('/label-print', getLabelToPrint);

router.post('/wh-order', handleWebhook);

router.post('/report-problem', reportProblem);

router.get('/orders-with-problem', getOrdersWithProblem);

router.post('/pack-order', packOrder);

router.post('/solve-problem', solveProblem);

router.get('/ship-orders', getOrdersToShip);

module.exports = router;
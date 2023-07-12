const express = require('express');
const { getUserData, getStoreData, getUsersData, getUserDataDashboard, getPedidosFromId, getShippingMethods } = require('../controllers/infoControllers');
const router = express.Router();

router.get('/user-data', getUserData);
router.get('/users-data', getUsersData);
router.get('/store-data', getStoreData);

router.get('/product-data', getPedidosFromId);
router.get('/user-data-dashboard', getUserDataDashboard);
router.get('/shipping-methods', getShippingMethods);


module.exports = router;
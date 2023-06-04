const express = require('express');
const { getUserData, getProductData, getStoreData, getUsersData, getUserDataDashboard } = require('../controllers/infoControllers');
const router = express.Router();

router.get('/user-data', getUserData);
router.get('/users-data', getUsersData);
router.get('/store-data', getStoreData);

router.get('/product-data', getProductData);
router.get('/user-data-dashboard', getUserDataDashboard);


module.exports = router;
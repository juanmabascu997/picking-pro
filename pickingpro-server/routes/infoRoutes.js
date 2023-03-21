const express = require('express');
const { getUserData, getProductData, getStoreData } = require('../controllers/infoControllers');
const router = express.Router();

router.get('/user-data', getUserData);
router.get('/store-data', getStoreData);

router.get('/product-data', getProductData);


module.exports = router;
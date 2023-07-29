const express = require('express');
const { cancelProductsForPick } = require('../controllers/pickingControllers');
const router = express.Router();


router.post('/cancel-products-for-pick', cancelProductsForPick);

module.exports = router;

const express = require('express');
const { cancelProductsForPick, getProductsToPickByMatch } = require('../controllers/pickingControllers');
const router = express.Router();


router.get('/cancel-products-for-pick', cancelProductsForPick);

router.get('/products-for-pick-by-match', getProductsToPickByMatch);


module.exports = router;

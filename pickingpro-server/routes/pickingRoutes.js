const express = await import('express');
const { cancelProductsForPick, getProductsToPickByMatch } = await import('../controllers/pickingControllers');
const router = express.Router();


router.post('/cancel-products-for-pick', cancelProductsForPick);

router.get('/products-for-pick-by-match', getProductsToPickByMatch);


module.exports = router;

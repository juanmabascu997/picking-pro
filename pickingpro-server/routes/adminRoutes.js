const express = await import('express');
const { setPickingGoals, setPackingGoals, getGoals } = await import('../controllers/adminControllers');
const router = express.Router();

router.post('/set-picking-goals', setPickingGoals);

router.post('/set-packing-goals', setPackingGoals);

router.get('/get-goals', getGoals);

module.exports = router;
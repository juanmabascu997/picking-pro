const express = await import('express');
const { createEstanteria, getEstanterias } = await import('../controllers/estanteriaControllers');

const router = express.Router();

router.post('/create', createEstanteria);

router.get('/get', getEstanterias);

module.exports = router;
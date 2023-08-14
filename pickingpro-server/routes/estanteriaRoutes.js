const express = require('express');
const { createEstanteria, getEstanterias } = require('../controllers/estanteriaControllers');

const router = express.Router();

router.post('/create', createEstanteria);

router.get('/get', getEstanterias);

module.exports = router;
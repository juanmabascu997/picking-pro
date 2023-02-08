const express = require('express');
const { register, login } = require('../controllers/authControllers');
const { checkUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post("/", checkUser); 


module.exports = router;
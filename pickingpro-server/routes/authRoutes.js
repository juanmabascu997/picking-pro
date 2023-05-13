const express = require('express');
const { register, login, validateUser } = require('../controllers/authControllers');
const { checkUser } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post("/", checkUser); 

router.post('/validate', validateUser)

module.exports = router;
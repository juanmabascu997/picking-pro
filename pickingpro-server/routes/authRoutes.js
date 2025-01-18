const express = await import('express');
const { register, login, validateUser, adminUser, resetPassword } = await import('../controllers/authControllers');
const { checkUser } = await import('../middlewares/authMiddleware');
const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.post("/", checkUser); 

router.post('/validate', validateUser)

router.post('/admin-user', adminUser)

router.put('/reset-pass', resetPassword)


module.exports = router;
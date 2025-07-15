const express = require('express');
const router = express.Router();
const { register, login, verifyMobileToken, googleLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-mobile', verifyMobileToken); 
router.post('/google', googleLogin);

module.exports = router;
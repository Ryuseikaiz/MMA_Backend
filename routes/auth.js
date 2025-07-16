const express = require("express");
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {
  register,
  login,
  verifyCode,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-code", verifyCode);
router.get(
  '/google/login/web',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Endpoint 2: URL Callback mà Google sẽ gọi lại
// Nó phải được thêm vào "Authorized redirect URIs" trên Google Cloud Console.
router.get(
  '/google/callback',
  // Passport sẽ xử lý việc trao đổi code lấy token và profile
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/login/failed', // Chuyển hướng nếu thất bại
    session: false // Không tạo session cookie
  }),
  // Nếu thành công, middleware này sẽ được gọi
  (req, res) => {
    // `req.user` được Passport gán sau khi xác thực thành công
    const user = req.user;

    // Tạo JWT token của ứng dụng bạn
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });

    // Dữ liệu người dùng cần gửi về app
    const userData = { id: user.id, fullName: user.fullName, email: user.email };

    // Tạo deep link để trả token và user data về ứng dụng
    const deepLink = `myproductapp://login-success?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;

    // Chuyển hướng trình duyệt đến deep link đó
    // Trình duyệt sẽ kích hoạt mở ứng dụng di động
    res.redirect(deepLink);
  }
);

// Endpoint 3: Xử lý khi đăng nhập thất bại
router.get('/login/failed', (req, res) => {
    const deepLink = `myproductapp://login-failed?error=AuthenticationFailed`;
    res.redirect(deepLink);
});

// Gỡ bỏ hoặc comment out route POST /api/auth/google cũ
// router.post('/google', googleLogin);

module.exports = router;

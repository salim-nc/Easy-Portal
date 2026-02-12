const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Routes publiques (sans authentification)
router.post('/login/admin', authcontroller.loginAdmin);
router.post('/login/user', authcontroller.loginUser);

// Routes protégées (nécessite authentification)
router.get('/verify', authMiddleware, authcontroller.verifyToken);
router.post('/register', authMiddleware, adminMiddleware, authcontroller.registerUser);

module.exports = router;
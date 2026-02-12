const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/usercontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Routes pour l'utilisateur connecté
router.get('/me', authMiddleware, usercontroller.getMyProfile);
router.put('/me', authMiddleware, usercontroller.updateMyProfile);

// Routes admin uniquement
router.get('/', authMiddleware, adminMiddleware, usercontroller.getAllUsers);
router.get('/:id', authMiddleware, adminMiddleware, usercontroller.getUserById);
router.put('/:id', authMiddleware, adminMiddleware, usercontroller.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, usercontroller.deleteUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification admin
router.get('/', authMiddleware, adminMiddleware, logController.getAllLogs);
router.get('/type/:type', authMiddleware, adminMiddleware, logController.getLogsByType);
router.get('/stats', authMiddleware, adminMiddleware, logController.getLogsStats);
router.get('/user/:userId', authMiddleware, adminMiddleware, logController.getLogsByUser);
router.get('/plaque/:plaqueId', authMiddleware, adminMiddleware, logController.getLogsByPlaque);
router.delete('/clean', authMiddleware, adminMiddleware, logController.cleanOldLogs);

module.exports = router;
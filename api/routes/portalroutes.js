const express = require('express');
const router = express.Router();
const portalcontroller = require('../controllers/portalcontroller');
const { authMiddleware } = require('../middleware/auth');

// Routes protégées
router.post('/open', authMiddleware, portalcontroller.openPortal);
router.get('/status', authMiddleware, portalcontroller.getPortalStatus);

// Route pour l'ouverture automatique par reconnaissance de plaque
router.post('/open-by-plaque', portalcontroller.openPortalByPlaque);

module.exports = router;
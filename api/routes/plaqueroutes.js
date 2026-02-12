const express = require('express');
const router = express.Router();
const plaquecontroller = require('../controllers/plaquecontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Route publique pour la vérification de plaque (système de reconnaissance)
router.post('/verify', plaquecontroller.verifyPlaque);

// Routes protégées (admins uniquement)
router.get('/', authMiddleware, adminMiddleware, plaquecontroller.getAllPlaques);
router.get('/:numero', authMiddleware, plaquecontroller.getPlaqueByNumber);
router.post('/', authMiddleware, adminMiddleware, plaquecontroller.addPlaque);
router.put('/:id', authMiddleware, adminMiddleware, plaquecontroller.updatePlaque);
router.delete('/:id', authMiddleware, adminMiddleware, plaquecontroller.deletePlaque);
router.get('/user/:userId', authMiddleware, plaquecontroller.getPlaquesByUser);

module.exports = router;
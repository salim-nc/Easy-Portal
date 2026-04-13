const express = require('express');
const router = express.Router();
const tpmsController = require('../controllers/tpmscontroller');
const { verifyToken } = require('../middleware/auth');

// POST /api/tpms — Enregistrer des données TPMS
router.post('/', verifyToken, tpmsController.addTpmsData);

// POST /api/tpms/verify/:plaque — Verifier le capteur TPMS d'une plaque
// Appelee par detection.py avec { capteur_id_detected } dans le body
router.post('/verify/:plaque', tpmsController.verifyTpms);

module.exports = router;
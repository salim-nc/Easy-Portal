const express = require('express');
const router = express.Router();
const tpmscontroller = require('../controllers/tpmscontroller');

// Route publique — recoit les donnees du capteur TPMS (GNU Radio / simulation)
router.post('/', tpmscontroller.addTpmsData);

// Route publique — verifie si le capteur TPMS correspond a la plaque
router.get('/verify/:plaque', tpmscontroller.verifyTpms);

module.exports = router;
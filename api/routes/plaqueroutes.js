const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const plaquecontroller = require('../controllers/plaquecontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/verify', plaquecontroller.verifyPlaque);
router.post('/import-csv', authMiddleware, adminMiddleware, upload.single('file'), plaquecontroller.importCSV);
router.post('/import-csv-blacklist', authMiddleware, adminMiddleware, upload.single('file'), plaquecontroller.importCSVBlacklist);
router.get('/export-csv', authMiddleware, adminMiddleware, plaquecontroller.exportCSV);
router.get('/export-csv-blacklist', authMiddleware, adminMiddleware, plaquecontroller.exportCSVBlacklist);
router.get('/', authMiddleware, adminMiddleware, plaquecontroller.getAllPlaques);
router.get('/:numero', authMiddleware, plaquecontroller.getPlaqueByNumber);
router.post('/', authMiddleware, adminMiddleware, plaquecontroller.addPlaque);
router.put('/:id', authMiddleware, adminMiddleware, plaquecontroller.updatePlaque);
router.delete('/:id', authMiddleware, adminMiddleware, plaquecontroller.deletePlaque);
router.get('/user/:userId', authMiddleware, plaquecontroller.getPlaquesByUser);

module.exports = router;

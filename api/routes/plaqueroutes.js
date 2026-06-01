const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const plaquecontroller = require('../controllers/plaquecontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   - name: Plaques d'immatriculation
 *     description: Gestion des plaques autorisées et de la blacklist
 */

/**
 * @openapi
 * /api/plaques/verify:
 *   post:
 *     summary: Vérifier si une plaque est valide
 *     tags: [Plaques d'immatriculation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numero:
 *                 type: string
 *     responses:
 *       200:
 *         description: Résultat de la vérification.
 */
router.post('/verify', plaquecontroller.verifyPlaque);

/**
 * @openapi
 * /api/plaques/import-csv:
 *   post:
 *     summary: Importer des plaques via CSV (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Importation réussie.
 */
router.post('/import-csv', authMiddleware, adminMiddleware, upload.single('file'), plaquecontroller.importCSV);

/**
 * @openapi
 * /api/plaques/import-csv-blacklist:
 *   post:
 *     summary: Importer une blacklist via CSV (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Importation réussie.
 */
router.post('/import-csv-blacklist', authMiddleware, adminMiddleware, upload.single('file'), plaquecontroller.importCSVBlacklist);

/**
 * @openapi
 * /api/plaques/export-csv:
 *   get:
 *     summary: Exporter la liste des plaques en CSV (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fichier CSV généré.
 */
router.get('/export-csv', authMiddleware, adminMiddleware, plaquecontroller.exportCSV);

/**
 * @openapi
 * /api/plaques/export-csv-blacklist:
 *   get:
 *     summary: Exporter la blacklist en CSV (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fichier CSV généré.
 */
router.get('/export-csv-blacklist', authMiddleware, adminMiddleware, plaquecontroller.exportCSVBlacklist);

/**
 * @openapi
 * /api/plaques:
 *   get:
 *     summary: Récupérer toutes les plaques (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste obtenue.
 *   post:
 *     summary: Ajouter une nouvelle plaque (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Plaque ajoutée.
 */
router.get('/', authMiddleware, adminMiddleware, plaquecontroller.getAllPlaques);
router.post('/', authMiddleware, adminMiddleware, plaquecontroller.addPlaque);

/**
 * @openapi
 * /api/plaques/{numero}:
 *   get:
 *     summary: Récupérer les détails d'une plaque par numéro
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numero
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plaque trouvée.
 */
router.get('/:numero', authMiddleware, plaquecontroller.getPlaqueByNumber);

/**
 * @openapi
 * /api/plaques/{id}:
 *   put:
 *     summary: Modifier une plaque par son ID (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plaque mise à jour.
 *   delete:
 *     summary: Supprimer une plaque par son ID (Admin)
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plaque supprimée.
 */
router.put('/:id', authMiddleware, adminMiddleware, plaquecontroller.updatePlaque);
router.delete('/:id', authMiddleware, adminMiddleware, plaquecontroller.deletePlaque);

/**
 * @openapi
 * /api/plaques/user/{userId}:
 *   get:
 *     summary: Obtenir les plaques associées à un utilisateur
 *     tags: [Plaques d'immatriculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste renvoyée.
 */
router.get('/user/:userId', authMiddleware, plaquecontroller.getPlaquesByUser);

module.exports = router;
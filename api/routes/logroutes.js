const express = require('express');
const router = express.Router();
const logController = require('../controllers/logcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   - name: Logs & Historique
 *     description: Consultation des historiques d'accès (Admin seulement)
 */

/**
 * @openapi
 * /api/logs:
 *   get:
 *     summary: Récupérer l'intégralité des logs
 *     tags: [Logs & Historique]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des logs.
 */
router.get('/', authMiddleware, adminMiddleware, logController.getAllLogs);

/**
 * @openapi
 * /api/logs/type/{type}:
 *   get:
 *     summary: Filtrer les logs par type
 *     tags: [Logs & Historique]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs filtrés renvoyés.
 */
router.get('/type/:type', authMiddleware, adminMiddleware, logController.getLogsByType);

/**
 * @openapi
 * /api/logs/stats:
 *   get:
 *     summary: Obtenir des statistiques sur les logs
 *     tags: [Logs & Historique]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données statistiques.
 */
router.get('/stats', authMiddleware, adminMiddleware, logController.getLogsStats);

/**
 * @openapi
 * /api/logs/user/{userId}:
 *   get:
 *     summary: Récupérer l'historique d'un utilisateur spécifique
 *     tags: [Logs & Historique]
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
 *         description: Logs renvoyés.
 */
router.get('/user/:userId', authMiddleware, adminMiddleware, logController.getLogsByUser);

/**
 * @openapi
 * /api/logs/plaque/{plaqueId}:
 *   get:
 *     summary: Récupérer les événements liés à un ID de plaque
 *     tags: [Logs & Historique]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: plaqueId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logs de la plaque.
 */
router.get('/plaque/:plaqueId', authMiddleware, adminMiddleware, logController.getLogsByPlaque);

/**
 * @openapi
 * /api/logs/clean:
 *   delete:
 *     summary: Nettoyer et purger les anciens logs
 *     tags: [Logs & Historique]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nettoyage effectué.
 */
router.delete('/clean', authMiddleware, adminMiddleware, logController.cleanOldLogs);

module.exports = router;
const express = require('express');
const router = express.Router();
const portalcontroller = require('../controllers/portalcontroller');
const { authMiddleware } = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   - name: Portail
 *     description: Contrôle et statut du portail d'accès
 */

/**
 * @openapi
 * /api/portal/open:
 *   post:
 *     summary: Actionner l'ouverture manuelle du portail
 *     tags: [Portail]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commande d'ouverture envoyée avec succès.
 */
router.post('/open', authMiddleware, portalcontroller.openPortal);

/**
 * @openapi
 * /api/portal/status:
 *   get:
 *     summary: Récupérer le statut actuel du portail
 *     tags: [Portail]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut récupéré.
 */
router.get('/status', authMiddleware, portalcontroller.getPortalStatus);

/**
 * @openapi
 * /api/portal/open-by-plaque:
 *   post:
 *     summary: Ouverture automatique par reconnaissance de plaque
 *     tags: [Portail]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plaque
 *             properties:
 *               plaque:
 *                 type: string
 *                 example: "AA-123-AA"
 *     responses:
 *       200:
 *         description: Autorisé - Le portail s'ouvre.
 *       403:
 *         description: Refusé - Plaque non autorisée.
 */
router.post('/open-by-plaque', portalcontroller.openPortalByPlaque);

module.exports = router;
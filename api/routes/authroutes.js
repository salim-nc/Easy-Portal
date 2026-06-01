const express = require('express');
const router = express.Router();
const authcontroller = require('../controllers/authcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   - name: Authentification
 *     description: Gestion des accès utilisateurs et administrateurs
 */

/**
 * @openapi
 * /api/auth/login/admin:
 *   post:
 *     summary: Connexion Administrateur
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, jeton généré.
 *       401:
 *         description: Identifiants invalides.
 */
router.post('/login/admin', authcontroller.loginAdmin);

/**
 * @openapi
 * /api/auth/login/user:
 *   post:
 *     summary: Connexion Utilisateur standard
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie.
 *       401:
 *         description: Identifiants invalides.
 */
router.post('/login/user', authcontroller.loginUser);

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     summary: Vérifier la validité du token actuel
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide.
 *       401:
 *         description: Token manquant ou expiré.
 */
router.get('/verify', authMiddleware, authcontroller.verifyToken);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Enregistrer un nouvel utilisateur (Admin seulement)
 *     tags: [Authentification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès.
 *       403:
 *         description: Droits insuffisants (Admin requis).
 */
router.post('/register', authMiddleware, adminMiddleware, authcontroller.registerUser);

module.exports = router;
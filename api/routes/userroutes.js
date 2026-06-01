const express = require('express');
const router = express.Router();
const usercontroller = require('../controllers/usercontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

/**
 * @openapi
 * tags:
 *   - name: Utilisateurs
 *     description: Gestion des profils et des comptes utilisateurs
 */

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Obtenir mon profil utilisateur actuel
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données du profil récupérées.
 *   put:
 *     summary: Mettre à jour mon profil utilisateur actuel
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profil mis à jour.
 */
router.get('/me', authMiddleware, usercontroller.getMyProfile);
router.put('/me', authMiddleware, usercontroller.updateMyProfile);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Liste de tous les utilisateurs (Admin seulement)
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste récupérée.
 */
router.get('/', authMiddleware, adminMiddleware, usercontroller.getAllUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur par son ID (Admin seulement)
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur trouvé.
 *   put:
 *     summary: Modifier un utilisateur (Admin seulement)
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur modifié.
 *   delete:
 *     summary: Supprimer un utilisateur (Admin seulement)
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur supprimé.
 */
router.get('/:id', authMiddleware, adminMiddleware, usercontroller.getUserById);
router.put('/:id', authMiddleware, adminMiddleware, usercontroller.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, usercontroller.deleteUser);

module.exports = router;
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, nom, prenom, email, type_acces
      FROM utilisateurs
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      'SELECT id, nom, prenom, email, telephone FROM utilisateurs WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les plaques de l'utilisateur
    const [plaques] = await db.query(
      'SELECT * FROM plaques WHERE utilisateurs_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        plaques
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Créer un nouvel utilisateur
exports.createUser = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await db.query(
      'SELECT id FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'utilisateur
    const [result] = await db.query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hashedPassword, telephone || null]
    );

    // Logger la création
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Nouvel utilisateur créé: ${email}`, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: result.insertId,
        nom,
        prenom,
        email
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, mot_de_passe } = req.body;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await db.query('SELECT * FROM utilisateurs WHERE id = ?', [id]);
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const [emailCheck] = await db.query(
        'SELECT id FROM utilisateurs WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Construire la requête de mise à jour
    let updateFields = [];
    let values = [];

    if (nom !== undefined) {
      updateFields.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined) {
      updateFields.push('prenom = ?');
      values.push(prenom);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      values.push(telephone);
    }
    if (mot_de_passe) {
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      updateFields.push('mot_de_passe = ?');
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE utilisateurs SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    // Logger la modification
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Utilisateur modifié: ${email || existingUsers[0].email}`, req.user.id]
    );

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await db.query('SELECT * FROM utilisateurs WHERE id = ?', [id]);
    
    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = existingUsers[0];

    // Supprimer les plaques associées (ou les mettre à NULL)
    await db.query('UPDATE plaques SET utilisateurs_id = NULL WHERE utilisateurs_id = ?', [id]);

    // Supprimer l'utilisateur
    await db.query('DELETE FROM utilisateurs WHERE id = ?', [id]);

    // Logger la suppression
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Utilisateur supprimé: ${user.email}`, req.user.id]
    );

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir le profil de l'utilisateur connecté
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query, table;
    if (userRole === 'admin') {
      table = 'administrateurs';
    } else {
      table = 'utilisateurs';
    }

    const [users] = await db.query(
      `SELECT id, nom, prenom, email, telephone FROM ${table} WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Si c'est un utilisateur normal, récupérer ses plaques
    let plaques = [];
    if (userRole === 'user') {
      const [userPlaques] = await db.query(
        'SELECT * FROM plaques WHERE utilisateurs_id = ?',
        [userId]
      );
      plaques = userPlaques;
    }

    res.json({
      success: true,
      data: {
        ...users[0],
        role: userRole,
        plaques
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Mettre à jour son propre profil
exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { nom, prenom, email, telephone, mot_de_passe, old_password } = req.body;

    const table = userRole === 'admin' ? 'administrateurs' : 'utilisateurs';

    // Si changement de mot de passe, vérifier l'ancien
    if (mot_de_passe) {
      if (!old_password) {
        return res.status(400).json({
          success: false,
          message: 'Ancien mot de passe requis'
        });
      }

      const [users] = await db.query(`SELECT mot_de_passe FROM ${table} WHERE id = ?`, [userId]);
      const isPasswordValid = await bcrypt.compare(old_password, users[0].mot_de_passe);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Ancien mot de passe incorrect'
        });
      }
    }

    // Construire la requête de mise à jour
    let updateFields = [];
    let values = [];

    if (nom !== undefined) {
      updateFields.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined) {
      updateFields.push('prenom = ?');
      values.push(prenom);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      values.push(email);
    }
    if (telephone !== undefined) {
      updateFields.push('telephone = ?');
      values.push(telephone);
    }
    if (mot_de_passe) {
      const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
      updateFields.push('mot_de_passe = ?');
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    values.push(userId);

    await db.query(
      `UPDATE ${table} SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
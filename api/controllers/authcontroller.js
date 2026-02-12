const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type_acces: user.type_acces // Ajouter le type d'accès dans le token
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Connexion administrateur
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const [admins] = await db.query(
      'SELECT * FROM administrateurs WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const admin = admins[0];

    const isPasswordValid = await bcrypt.compare(password, admin.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: 'admin',
      type_acces: 'TOTAL'
    });

    // Logger la connexion administrateur
    await db.query(
      'INSERT INTO logs (action, administrateurs_id) VALUES (?, ?)',
      [`Connexion administrateur: ${admin.email}`, admin.id]
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: admin.id,
          nom: admin.nom,
          prenom: admin.prenom,
          email: admin.email,
          role: 'admin',
          type_acces: 'TOTAL'
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Connexion utilisateur
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const [users] = await db.query(
      'SELECT * FROM utilisateurs WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: 'user',
      type_acces: user.type_acces.toUpperCase()
    });

    await db.query(
      'INSERT INTO logs (action, administrateurs_id) VALUES (?, ?)',
      [`Connexion utilisateur: ${user.email}`, req.user?.id || null]
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: 'user',
          type_acces: user.type_acces.toUpperCase()
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Inscription d'un nouvel utilisateur (par un admin)
exports.registerUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, type_acces } = req.body;

    if (!nom || !prenom || !email || !password || !type_acces) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    const access = type_acces.toUpperCase();

    if (!['TOTAL', 'REDUIT'].includes(access)) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'accès invalide. Doit être "TOTAL" ou "REDUIT"'
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, type_acces) VALUES (?, ?, ?, ?, ?)',
      [nom, prenom, email, hashedPassword, access]
    );

    // Logger l'inscription
    await db.query(
      'INSERT INTO logs (action, administrateurs_id) VALUES (?, ?)',
      [`Nouvel utilisateur créé: ${email} (accès ${access})`, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: result.insertId,
        nom,
        prenom,
        email,
        type_acces: access
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// Vérifier le token (pour vérifier si l'utilisateur est toujours connecté)
exports.verifyToken = async (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    data: {
      user: req.user
    }
  });
};

// Déconnexion
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await db.query(
        'INSERT INTO logs (action, administrateurs_id) VALUES (?, ?)',
        [`Déconnexion: ${req.user.email}`, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la déconnexion'
    });
  }
};

const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware pour vérifier que l'utilisateur est un administrateur
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Droits administrateur requis.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
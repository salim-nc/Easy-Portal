const db = require('../config/database');

// Simuler l'ouverture du portail (à adapter selon votre hardware)
const openPortalHardware = async () => {
  // Cette fonction doit être adaptée selon votre système:
  // - GPIO sur Raspberry Pi
  // - Requête HTTP vers un contrôleur
  // - Signal série, etc.
  
  console.log('🚪 Ouverture du portail...');
  
  // Exemple avec requête HTTP vers un contrôleur Raspberry
  if (process.env.RASPBERRY_PI_URL) {
    try {
      const response = await fetch(`${process.env.RASPBERRY_PI_URL}/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return response.ok;
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du portail:', error);
      return false;
    }
  }
  
  // Simulation pour le développement
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('✅ Portail ouvert (simulation)');
      resolve(true);
    }, 1000);
  });
};

// Ouvrir le portail (endpoint pour admins et utilisateurs authentifiés)
exports.openPortal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userTypeAcces = req.user.type_acces;
    const { reason } = req.body; // Raison optionnelle

    // Vérifier les permissions
    // Seuls les admins et les utilisateurs avec accès "total" peuvent ouvrir manuellement
    if (userRole !== 'admin' && userTypeAcces !== 'total') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Votre type d\'accès ne permet pas l\'ouverture manuelle du portail.'
      });
    }

    // Ouvrir le portail
    const success = await openPortalHardware();

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ouverture du portail'
      });
    }

    // Logger l'ouverture
    const description = reason 
      ? `Portail ouvert manuellement par ${userRole === 'admin' ? 'admin' : 'utilisateur'}: ${reason}`
      : `Portail ouvert manuellement par ${userRole === 'admin' ? 'admin' : 'utilisateur'}`;

    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [description, userId]
    );

    res.json({
      success: true,
      message: 'Portail ouvert avec succès',
      data: {
        opened_at: new Date().toISOString(),
        opened_by: userRole,
        type_acces: userTypeAcces
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du portail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ouvrir le portail après reconnaissance de plaque
exports.openPortalByPlaque = async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de plaque requis'
      });
    }

    // Normaliser le numéro
    const numeroNormalize = numero.replace(/\s/g, '').toUpperCase();

    // Vérifier si la plaque est autorisée
    const [plaques] = await db.query(
      'SELECT * FROM plaques WHERE REPLACE(numero_plaque, " ", "") = ? AND statut = 1',
      [numeroNormalize]
    );

    if (plaques.length === 0) {
      // Logger le refus
      await db.query(
        'INSERT INTO logs (action) VALUES (?)',
        [`Accès refusé - Plaque inconnue: ${numero}`]
      );

      return res.status(403).json({
        success: false,
        message: 'Plaque non autorisée',
        authorized: false
      });
    }

    const plaque = plaques[0];

    // Vérifier le type d'accès de l'utilisateur associé à la plaque
    // Les utilisateurs avec accès "reduit" et "total" peuvent ouvrir via détection de plaque
    let userName = 'Inconnu';
    let userTypeAcces = null;
    
    if (plaque.utilisateurs_id) {
      const [users] = await db.query(
        'SELECT nom, prenom, type_acces FROM utilisateurs WHERE id = ?',
        [plaque.utilisateurs_id]
      );
      
      if (users.length > 0) {
        userName = `${users[0].prenom} ${users[0].nom}`;
        userTypeAcces = users[0].type_acces;
      }
    }

    // Ouvrir le portail
    const success = await openPortalHardware();

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ouverture du portail'
      });
    }

    // Logger l'ouverture
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [
        `Portail ouvert automatiquement - Plaque: ${numero} - Utilisateur: ${userName}`,
        plaque.utilisateurs_id,
        plaque.id
      ]
    );

    res.json({
      success: true,
      message: 'Portail ouvert avec succès',
      authorized: true,
      data: {
        plaque: plaque.numero_plaque,
        user: userName,
        type_acces: userTypeAcces,
        opened_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ouverture du portail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir le statut du portail
exports.getPortalStatus = async (req, res) => {
  try {
    // Récupérer les dernières ouvertures
    const [recentLogs] = await db.query(`
      SELECT l.*, u.nom, u.prenom, p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      WHERE l.action LIKE '%portail%' OR l.action LIKE '%accès%' OR l.action LIKE '%Accès%'
      ORDER BY l.date_heure DESC
      LIMIT 10
    `);

    // Statistiques du jour
    const today = new Date().toISOString().split('T')[0];
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_ouvertures,
        SUM(CASE WHEN action LIKE '%automatique%' THEN 1 ELSE 0 END) as ouvertures_auto,
        SUM(CASE WHEN action LIKE '%manuelle%' THEN 1 ELSE 0 END) as ouvertures_manuelles,
        SUM(CASE WHEN action LIKE '%refusé%' THEN 1 ELSE 0 END) as acces_refuses
      FROM logs
      WHERE DATE(date_heure) = ?
    `, [today]);

    res.json({
      success: true,
      data: {
        status: 'operational',
        recent_activity: recentLogs,
        today_stats: stats[0]
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
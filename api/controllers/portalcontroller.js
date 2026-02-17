const db = require('../config/database');

// Ouvrir le portail via le serveur de commande
const openPortalHardware = async () => {
  console.log('Ouverture du portail...');
  try {
    const response = await fetch('http://host.docker.internal:5000/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      console.log('Portail ouvert avec succes');
      return true;
    }
    return false;
  } catch (error) {
    // Fallback: essayer avec l'IP du host
    try {
      const response = await fetch('http://172.17.0.1:5000/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) {
        console.log('Portail ouvert avec succes (fallback)');
        return true;
      }
    } catch (e) {
      console.error('Erreur ouverture portail:', e.message);
    }
    return false;
  }
};

// Ouvrir le portail (endpoint pour admins et utilisateurs authentifies)
exports.openPortal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userTypeAcces = req.user.type_acces;
    const { reason } = req.body;

    if (userRole !== 'admin' && userTypeAcces !== 'TOTAL') {
      return res.status(403).json({
        success: false,
        message: 'Acces refuse. Votre type d acces ne permet pas l ouverture manuelle du portail.'
      });
    }

    const success = await openPortalHardware();

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l ouverture du portail'
      });
    }

    const description = reason
      ? `Portail ouvert manuellement par ${userRole === 'admin' ? 'admin' : 'utilisateur'}: ${reason}`
      : `Portail ouvert manuellement par ${userRole === 'admin' ? 'admin' : 'utilisateur'}`;

    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [description, userId]
    );

    res.json({
      success: true,
      message: 'Portail ouvert avec succes',
      data: {
        opened_at: new Date().toISOString(),
        opened_by: userRole,
        type_acces: userTypeAcces
      }
    });
  } catch (error) {
    console.error('Erreur lors de l ouverture du portail:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Ouvrir le portail apres reconnaissance de plaque
exports.openPortalByPlaque = async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({ success: false, message: 'Numero de plaque requis' });
    }

    const numeroNormalize = numero.replace(/\s/g, '').toUpperCase();

    const [plaques] = await db.query(
      "SELECT * FROM plaques WHERE REPLACE(numero_plaque, ' ', '') = ? AND statut = 'AUTORISEE'",
      [numeroNormalize]
    );

    if (plaques.length === 0) {
      await db.query(
        'INSERT INTO logs (action) VALUES (?)',
        [`Acces refuse - Plaque inconnue: ${numero}`]
      );
      return res.status(403).json({ success: false, message: 'Plaque non autorisee', authorized: false });
    }

    const plaque = plaques[0];
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

    const success = await openPortalHardware();

    if (!success) {
      return res.status(500).json({ success: false, message: 'Erreur lors de l ouverture du portail' });
    }

    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Portail ouvert automatiquement - Plaque: ${numero} - Utilisateur: ${userName}`, plaque.utilisateurs_id, plaque.id]
    );

    res.json({
      success: true,
      message: 'Portail ouvert avec succes',
      authorized: true,
      data: {
        plaque: plaque.numero_plaque,
        user: userName,
        type_acces: userTypeAcces,
        opened_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur lors de l ouverture du portail:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Obtenir le statut du portail
exports.getPortalStatus = async (req, res) => {
  try {
    const [recentLogs] = await db.query(`
      SELECT l.*, u.nom, u.prenom, p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      WHERE l.action LIKE '%portail%' OR l.action LIKE '%acces%'
      ORDER BY l.date_heure DESC
      LIMIT 10
    `);

    const today = new Date().toISOString().split('T')[0];
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total_ouvertures,
        SUM(CASE WHEN action LIKE '%automatique%' THEN 1 ELSE 0 END) as ouvertures_auto,
        SUM(CASE WHEN action LIKE '%manuelle%' THEN 1 ELSE 0 END) as ouvertures_manuelles,
        SUM(CASE WHEN action LIKE '%refuse%' THEN 1 ELSE 0 END) as acces_refuses
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
    console.error('Erreur lors de la recuperation du statut:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

const db = require('../config/database');
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:5000';

const openPortalHardware = async () => {
  try {
    const response = await fetch(`${PYTHON_API_URL}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    console.error('[HARDWARE] Erreur:', error.message);
    return false;
  }
};

exports.openPortal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { reason } = req.body;

    const success = await openPortalHardware();

    // Logique de séparation demandée :
    let logUser = null;
    let logAdmin = null;

    if (userRole === 'admin') {
      logAdmin = userId; // On remplit uniquement la colonne admin
    } else {
      logUser = userId;  // On remplit uniquement la colonne utilisateur
    }

    if (!success) {
      await db.query(
        'INSERT INTO logs (action, utilisateurs_id, administrateurs_id) VALUES (?, ?, ?)',
        [`ÉCHEC : Portail non ouvert (${reason || 'manuel'})`, logUser, logAdmin]
      );
      return res.status(500).json({ success: false, message: 'Le serveur matériel ne répond pas' });
    }

    const description = reason ? `Portail ouvert : ${reason}` : `Ouverture manuelle via Dashboard`;
    
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, administrateurs_id) VALUES (?, ?, ?)',
      [description, logUser, logAdmin]
    );

    res.json({ success: true, message: 'Portail ouvert' });
  } catch (error) {
    console.error('Erreur portalController:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.openPortalByPlaque = async (req, res) => {
  try {
    const { numero } = req.body;
    if (!numero) return res.status(400).json({ success: false, message: 'Plaque requise' });

    const numeroNormalize = numero.replace(/\s/g, '').toUpperCase();
    
    const [results] = await db.query(
      `SELECT p.*, u.nom, u.prenom 
       FROM plaques p 
       LEFT JOIN utilisateurs u ON p.utilisateurs_id = u.id 
       WHERE REPLACE(p.numero_plaque, ' ', '') = ? AND p.statut = 'AUTORISEE'`,
      [numeroNormalize]
    );

    if (results.length === 0) {
      await db.query('INSERT INTO logs (action) VALUES (?)', [`Accès refusé : Plaque ${numero} inconnue`]);
      return res.status(403).json({ success: false, authorized: false });
    }

    const success = await openPortalHardware();
    if (!success) return res.status(500).json({ success: false });

    // Pour une plaque, c'est forcément lié à un utilisateurs_id
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Ouverture auto : Plaque ${numero}`, results[0].utilisateurs_id, results[0].id]
    );

    res.json({ success: true, authorized: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getPortalStatus = async (req, res) => {
  try {
    const [recentLogs] = await db.query(`SELECT * FROM logs ORDER BY date_heure DESC LIMIT 5`);
    res.json({ success: true, data: { status: 'operational', recent_activity: recentLogs } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
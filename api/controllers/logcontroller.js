const db = require('../config/database');

exports.getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let query = `
      SELECT l.*, 
             COALESCE(u.nom, a.nom, up.nom) as user_nom, 
             COALESCE(u.prenom, a.prenom, up.prenom) as user_prenom, 
             COALESCE(u.email, a.email, up.email) as user_email,
             p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN administrateurs a ON l.administrateurs_id = a.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      LEFT JOIN utilisateurs up ON p.utilisateurs_id = up.id
      ORDER BY l.date_heure DESC LIMIT ? OFFSET ?
    `;

    const [logs] = await db.query(query, [limit, offset]);
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM logs');

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page, limit, total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur getAllLogs:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getLogsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const [logs] = await db.query(`
      SELECT l.*, 
             COALESCE(u.nom, a.nom, up.nom) as user_nom, 
             COALESCE(u.prenom, a.prenom, up.prenom) as user_prenom,
             p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN administrateurs a ON l.administrateurs_id = a.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      LEFT JOIN utilisateurs up ON p.utilisateurs_id = up.id
      WHERE l.action LIKE ?
      ORDER BY l.date_heure DESC
      LIMIT ?
    `, [`%${type}%`, limit]);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getLogsStats = async (req, res) => {
  try {
    const period = req.query.period || 'today';
    let dateCondition = '';
    switch (period) {
      case 'today': dateCondition = 'DATE(date_heure) = CURDATE()'; break;
      case 'week': dateCondition = 'date_heure >= DATE_SUB(NOW(), INTERVAL 7 DAY)'; break;
      case 'month': dateCondition = 'date_heure >= DATE_SUB(NOW(), INTERVAL 30 DAY)'; break;
      default: dateCondition = '1=1';
    }
    const [generalStats] = await db.query(`
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN action LIKE '%ouverture%automatique%' OR action LIKE '%autorise%' THEN 1 ELSE 0 END) as ouvertures_auto,
        SUM(CASE WHEN action LIKE '%ouverture%manuelle%' OR action LIKE '%admin%' THEN 1 ELSE 0 END) as ouvertures_manuelles,
        SUM(CASE WHEN action LIKE '%refusé%' OR action LIKE '%interdite%' THEN 1 ELSE 0 END) as acces_refuses,
        SUM(CASE WHEN action LIKE '%connexion%' THEN 1 ELSE 0 END) as connexions
      FROM logs WHERE ${dateCondition}
    `);
    const [topUsers] = await db.query(`
      SELECT u.id, u.nom, u.prenom, u.email, COUNT(l.id) as activity_count
      FROM utilisateurs u INNER JOIN logs l ON u.id = l.utilisateurs_id
      WHERE ${dateCondition} GROUP BY u.id ORDER BY activity_count DESC LIMIT 10
    `);
    const [topPlaques] = await db.query(`
      SELECT p.id, p.numero_plaque, COUNT(l.id) as usage_count
      FROM plaques p INNER JOIN logs l ON p.id = l.plaques_id
      WHERE ${dateCondition} GROUP BY p.id ORDER BY usage_count DESC LIMIT 10
    `);
    let hourlyActivity = [];
    if (period === 'today') {
      const [hourlyStats] = await db.query(`
        SELECT HOUR(date_heure) as hour, COUNT(*) as count
        FROM logs WHERE DATE(date_heure) = CURDATE()
        GROUP BY HOUR(date_heure) ORDER BY hour
      `);
      hourlyActivity = hourlyStats;
    }
    res.json({ success: true, data: { period, general: generalStats[0], top_users: topUsers, top_plaques: topPlaques, hourly_activity: hourlyActivity } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const [logs] = await db.query(`
      SELECT l.*, p.numero_plaque as plaque_numero
      FROM logs l LEFT JOIN plaques p ON l.plaques_id = p.id
      WHERE l.utilisateurs_id = ? ORDER BY l.date_heure DESC LIMIT ?
    `, [userId, limit]);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getLogsByPlaque = async (req, res) => {
  try {
    const { plaqueId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const [logs] = await db.query(`
      SELECT l.*, COALESCE(u.nom, up.nom) as user_nom, COALESCE(u.prenom, up.prenom) as user_prenom
      FROM logs l 
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      LEFT JOIN utilisateurs up ON p.utilisateurs_id = up.id
      WHERE l.plaques_id = ? ORDER BY l.date_heure DESC LIMIT ?
    `, [plaqueId, limit]);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.cleanOldLogs = async (req, res) => {
  try {
    const { days } = req.body;
    const [result] = await db.query('DELETE FROM logs WHERE date_heure < DATE_SUB(NOW(), INTERVAL ? DAY)', [days]);
    await db.query('INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)', [`Nettoyage : ${result.affectedRows} supprimés`, req.user.id]);
    res.json({ success: true, data: { deleted_count: result.affectedRows } });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
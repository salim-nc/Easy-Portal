const db = require('../config/database');

// Obtenir tous les logs (avec pagination)
exports.getAllLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let query = `
      SELECT l.*, 
             u.nom as user_nom, u.prenom as user_prenom, u.email as user_email,
             p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      ORDER BY l.date_heure DESC LIMIT ? OFFSET ?
    `;

    let countQuery = 'SELECT COUNT(*) as total FROM logs';

    const [logs] = await db.query(query, [limit, offset]);
    const [countResult] = await db.query(countQuery);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les logs par type
exports.getLogsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const [logs] = await db.query(`
      SELECT l.*, 
             u.nom as user_nom, u.prenom as user_prenom, u.email as user_email,
             p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      LEFT JOIN plaques p ON l.plaques_id = p.id
      WHERE l.action LIKE ?
      ORDER BY l.date_heure DESC
      LIMIT ?
    `, [`%${type}%`, limit]);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les statistiques des logs
exports.getLogsStats = async (req, res) => {
  try {
    const period = req.query.period || 'today'; // today, week, month, all

    let dateCondition = '';
    switch (period) {
      case 'today':
        dateCondition = 'DATE(date_heure) = CURDATE()';
        break;
      case 'week':
        dateCondition = 'date_heure >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateCondition = 'date_heure >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      default:
        dateCondition = '1=1'; // all
    }

    // Statistiques générales
    const [generalStats] = await db.query(`
      SELECT 
        COUNT(*) as total_logs,
        SUM(CASE WHEN action LIKE '%ouverture%automatique%' THEN 1 ELSE 0 END) as ouvertures_auto,
        SUM(CASE WHEN action LIKE '%ouverture%manuelle%' THEN 1 ELSE 0 END) as ouvertures_manuelles,
        SUM(CASE WHEN action LIKE '%refusé%' THEN 1 ELSE 0 END) as acces_refuses,
        SUM(CASE WHEN action LIKE '%connexion%' THEN 1 ELSE 0 END) as connexions
      FROM logs
      WHERE ${dateCondition}
    `);

    // Top utilisateurs
    const [topUsers] = await db.query(`
      SELECT 
        u.id, u.nom, u.prenom, u.email,
        COUNT(l.id) as activity_count
      FROM utilisateurs u
      INNER JOIN logs l ON u.id = l.utilisateurs_id
      WHERE ${dateCondition}
      GROUP BY u.id
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    // Top plaques
    const [topPlaques] = await db.query(`
      SELECT 
        p.id, p.numero_plaque,
        COUNT(l.id) as usage_count
      FROM plaques p
      INNER JOIN logs l ON p.id = l.plaques_id
      WHERE ${dateCondition}
      GROUP BY p.id
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // Activité par heure (pour aujourd'hui)
    let hourlyActivity = [];
    if (period === 'today') {
      const [hourlyStats] = await db.query(`
        SELECT 
          HOUR(date_heure) as hour,
          COUNT(*) as count
        FROM logs
        WHERE DATE(date_heure) = CURDATE()
        GROUP BY HOUR(date_heure)
        ORDER BY hour
      `);
      hourlyActivity = hourlyStats;
    }

    res.json({
      success: true,
      data: {
        period,
        general: generalStats[0],
        top_users: topUsers,
        top_plaques: topPlaques,
        hourly_activity: hourlyActivity
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les logs d'un utilisateur spécifique
exports.getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const [logs] = await db.query(`
      SELECT l.*, p.numero_plaque as plaque_numero
      FROM logs l
      LEFT JOIN plaques p ON l.plaques_id = p.id
      WHERE l.utilisateurs_id = ?
      ORDER BY l.date_heure DESC
      LIMIT ?
    `, [userId, limit]);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les logs d'une plaque spécifique
exports.getLogsByPlaque = async (req, res) => {
  try {
    const { plaqueId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const [logs] = await db.query(`
      SELECT l.*, 
             u.nom as user_nom, u.prenom as user_prenom, u.email as user_email
      FROM logs l
      LEFT JOIN utilisateurs u ON l.utilisateurs_id = u.id
      WHERE l.plaques_id = ?
      ORDER BY l.date_heure DESC
      LIMIT ?
    `, [plaqueId, limit]);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer les vieux logs (nettoyage)
exports.cleanOldLogs = async (req, res) => {
  try {
    const { days } = req.body; // Nombre de jours à conserver

    if (!days || days < 1) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de jours invalide'
      });
    }

    const [result] = await db.query(
      'DELETE FROM logs WHERE date_heure < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    // Logger l'action
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Suppression des logs de plus de ${days} jours (${result.affectedRows} entrées)`, req.user.id]
    );

    res.json({
      success: true,
      message: 'Logs nettoyés avec succès',
      data: {
        deleted_count: result.affectedRows
      }
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
const db = require('../config/database');

// Obtenir toutes les plaques
exports.getAllPlaques = async (req, res) => {
  try {
    const [plaques] = await db.query(`
      SELECT p.*, u.nom, u.prenom, u.email
      FROM plaques p
      LEFT JOIN utilisateurs u ON p.utilisateurs_id = u.id
      ORDER BY p.id DESC
    `);

    res.json({
      success: true,
      data: plaques
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des plaques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir une plaque par son numéro
exports.getPlaqueByNumber = async (req, res) => {
  try {
    const { numero } = req.params;

    const [plaques] = await db.query(`
      SELECT p.*, u.nom, u.prenom, u.email
      FROM plaques p
      LEFT JOIN utilisateurs u ON p.utilisateurs_id = u.id
      WHERE p.numero_plaque = ?
    `, [numero]);

    if (plaques.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plaque non trouvée'
      });
    }

    res.json({
      success: true,
      data: plaques[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la plaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Vérifier si une plaque est autorisée (pour le système de reconnaissance)
exports.verifyPlaque = async (req, res) => {
  try {
    const { numero } = req.body;

    if (!numero) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de plaque requis'
      });
    }

    // Normaliser le numéro (enlever espaces, mettre en majuscule)
    const numeroNormalize = numero.replace(/\s/g, '').toUpperCase();

    const [plaques] = await db.query(
      'SELECT * FROM plaques WHERE REPLACE(numero_plaque, " ", "") = ? AND statut = 1',
      [numeroNormalize]
    );

    const isAuthorized = plaques.length > 0;

    // Logger la vérification
    await db.query(
      'INSERT INTO logs (action, plaques_id) VALUES (?, ?)',
      [
        `Plaque ${numero}: ${isAuthorized ? 'Accès autorisé' : 'Accès refusé'}`,
        isAuthorized ? plaques[0].id : null
      ]
    );

    res.json({
      success: true,
      authorized: isAuthorized,
      message: isAuthorized ? 'Accès autorisé' : 'Accès refusé',
      data: isAuthorized ? {
        plaque: plaques[0]
      } : null
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la plaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Ajouter une nouvelle plaque
exports.addPlaque = async (req, res) => {
  try {
    const { numero, utilisateurs_id, description } = req.body;

    if (!numero) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de plaque requis'
      });
    }

    // Vérifier si la plaque existe déjà
    const [existingPlaques] = await db.query(
      'SELECT id FROM plaques WHERE numero_plaque = ?',
      [numero]
    );

    if (existingPlaques.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cette plaque existe déjà dans la base de données'
      });
    }

    // Vérifier si l'utilisateur existe (si utilisateurs_id fourni)
    if (utilisateurs_id) {
      const [users] = await db.query('SELECT id FROM utilisateurs WHERE id = ?', [utilisateurs_id]);
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
    }

    // Insérer la plaque
    const [result] = await db.query(
      'INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 1)',
      [numero, utilisateurs_id || null]
    );

    // Logger l'ajout
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Plaque ajoutée: ${numero}`, req.user.id, result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Plaque ajoutée avec succès',
      data: {
        id: result.insertId,
        numero,
        utilisateurs_id
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la plaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Modifier une plaque
exports.updatePlaque = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, utilisateurs_id, statut } = req.body;

    // Vérifier si la plaque existe
    const [existingPlaques] = await db.query('SELECT * FROM plaques WHERE id = ?', [id]);
    
    if (existingPlaques.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plaque non trouvée'
      });
    }

    // Construire la requête de mise à jour dynamiquement
    let updateFields = [];
    let values = [];

    if (numero !== undefined) {
      updateFields.push('numero_plaque = ?');
      values.push(numero);
    }
    if (utilisateurs_id !== undefined) {
      updateFields.push('utilisateurs_id = ?');
      values.push(utilisateurs_id);
    }
    if (statut !== undefined) {
      updateFields.push('statut = ?');
      values.push(statut ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun champ à mettre à jour'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE plaques SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    // Logger la modification
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Plaque modifiée: ${numero || existingPlaques[0].numero_plaque}`, req.user.id, id]
    );

    res.json({
      success: true,
      message: 'Plaque mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la plaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Supprimer une plaque
exports.deletePlaque = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la plaque existe
    const [existingPlaques] = await db.query('SELECT * FROM plaques WHERE id = ?', [id]);
    
    if (existingPlaques.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plaque non trouvée'
      });
    }

    const plaque = existingPlaques[0];

    // Supprimer la plaque
    await db.query('DELETE FROM plaques WHERE id = ?', [id]);

    // Logger la suppression
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Plaque supprimée: ${plaque.numero_plaque}`, req.user.id]
    );

    res.json({
      success: true,
      message: 'Plaque supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la plaque:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

// Obtenir les plaques d'un utilisateur
exports.getPlaquesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const [plaques] = await db.query(
      'SELECT * FROM plaques WHERE utilisateurs_id = ? ORDER BY id DESC',
      [userId]
    );

    res.json({
      success: true,
      data: plaques
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des plaques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};
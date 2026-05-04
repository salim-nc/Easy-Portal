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
    res.json({ success: true, data: plaques });
  } catch (error) {
    console.error('Erreur lors de la recuperation des plaques:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Obtenir une plaque par son numero
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
      return res.status(404).json({ success: false, message: 'Plaque non trouvee' });
    }
    res.json({ success: true, data: plaques[0] });
  } catch (error) {
    console.error('Erreur lors de la recuperation de la plaque:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Verifier si une plaque est autorisee
exports.verifyPlaque = async (req, res) => {
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
    const isAuthorized = plaques.length > 0;
    await db.query(
      'INSERT INTO logs (action, plaques_id) VALUES (?, ?)',
      [`Plaque ${numero}: ${isAuthorized ? 'Acces autorise' : 'Acces refuse'}`, isAuthorized ? plaques[0].id : null]
    );
    res.json({
      success: true,
      authorized: isAuthorized,
      message: isAuthorized ? 'Acces autorise' : 'Acces refuse',
      data: isAuthorized ? { plaque: plaques[0] } : null
    });
  } catch (error) {
    console.error('Erreur lors de la verification de la plaque:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Ajouter une nouvelle plaque
exports.addPlaque = async (req, res) => {
  try {
    const { numero, utilisateurs_id, description } = req.body;
    if (!numero) {
      return res.status(400).json({ success: false, message: 'Numero de plaque requis' });
    }
    const [existingPlaques] = await db.query('SELECT id FROM plaques WHERE numero_plaque = ?', [numero]);
    if (existingPlaques.length > 0) {
      return res.status(409).json({ success: false, message: 'Cette plaque existe deja dans la base de donnees' });
    }
    if (utilisateurs_id) {
      const [users] = await db.query('SELECT id FROM utilisateurs WHERE id = ?', [utilisateurs_id]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
      }
    }
    const [result] = await db.query(
      "INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 'AUTORISEE')",
      [numero, utilisateurs_id || null]
    );
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Plaque ajoutee: ${numero}`, req.user.id, result.insertId]
    );
    res.status(201).json({
      success: true,
      message: 'Plaque ajoutee avec succes',
      data: { id: result.insertId, numero, utilisateurs_id }
    });
  } catch (error) {
    console.error('Erreur lors de l ajout de la plaque:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Modifier une plaque
exports.updatePlaque = async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, utilisateurs_id, statut } = req.body;
    const [existingPlaques] = await db.query('SELECT * FROM plaques WHERE id = ?', [id]);
    if (existingPlaques.length === 0) {
      return res.status(404).json({ success: false, message: 'Plaque non trouvee' });
    }
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
      values.push(statut === 'INTERDITE' ? 'INTERDITE' : 'AUTORISEE');
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ a mettre a jour' });
    }
    values.push(id);
    await db.query(`UPDATE plaques SET ${updateFields.join(', ')} WHERE id = ?`, values);
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id, plaques_id) VALUES (?, ?, ?)',
      [`Plaque modifiee: ${numero || existingPlaques[0].numero_plaque}`, req.user.id, id]
    );
    res.json({ success: true, message: 'Plaque mise a jour avec succes' });
  } catch (error) {
    console.error('Erreur lors de la mise a jour de la plaque:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer une plaque
exports.deletePlaque = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingPlaques] = await db.query('SELECT * FROM plaques WHERE id = ?', [id]);
    if (existingPlaques.length === 0) {
      return res.status(404).json({ success: false, message: 'Plaque non trouvee' });
    }
    const plaque = existingPlaques[0];

    // Supprimer les logs lies a cette plaque avant de supprimer la plaque (contrainte FK)
    await db.query('DELETE FROM logs WHERE plaques_id = ?', [id]);

    await db.query('DELETE FROM plaques WHERE id = ?', [id]);

    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Plaque supprimee: ${plaque.numero_plaque}`, req.user.id]
    );
    res.json({ success: true, message: 'Plaque supprimee avec succes' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la plaque:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Obtenir les plaques d un utilisateur
exports.getPlaquesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const [plaques] = await db.query(
      'SELECT * FROM plaques WHERE utilisateurs_id = ? ORDER BY id DESC',
      [userId]
    );
    res.json({ success: true, data: plaques });
  } catch (error) {
    console.error('Erreur lors de la recuperation des plaques:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Importer des plaques depuis un fichier CSV
exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fichier CSV requis' });
    }
    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const firstLine = lines[0].toLowerCase();
    const startIndex = (firstLine.includes('nom') || firstLine.includes('prenom')) ? 1 : 0;
    let added = 0;
    let errors = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim());
      if (cols.length < 3) {
        errors.push(`Ligne ${i + 1}: format invalide`);
        continue;
      }
      const nom = cols[0];
      const prenom = cols[1];
      const plaque1 = cols[2] ? cols[2].replace(/\s/g, '').toUpperCase() : null;
      const plaque2 = cols[3] ? cols[3].replace(/\s/g, '').toUpperCase() : null;
      let userId = null;
      if (nom && prenom) {
        const [existingUsers] = await db.query(
          'SELECT id FROM utilisateurs WHERE nom = ? AND prenom = ?',
          [nom, prenom]
        );
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
        }
      }
      if (plaque1) {
        try {
          const [existing] = await db.query('SELECT id FROM plaques WHERE numero_plaque = ?', [plaque1]);
          if (existing.length === 0) {
            await db.query(
              "INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 'AUTORISEE')",
              [plaque1, userId]
            );
            added++;
          }
        } catch (e) {
          errors.push(`Ligne ${i + 1}: erreur plaque ${plaque1}`);
        }
      }
      if (plaque2) {
        try {
          const [existing] = await db.query('SELECT id FROM plaques WHERE numero_plaque = ?', [plaque2]);
          if (existing.length === 0) {
            await db.query(
              "INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 'AUTORISEE')",
              [plaque2, userId]
            );
            added++;
          }
        } catch (e) {
          errors.push(`Ligne ${i + 1}: erreur plaque ${plaque2}`);
        }
      }
    }
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Import CSV: ${added} plaques ajoutees`, req.user.id]
    );
    res.json({
      success: true,
      message: `Import termine: ${added} plaques ajoutees`,
      data: { added, errors }
    });
  } catch (error) {
    console.error('Erreur lors de l import CSV:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Importer des plaques interdites depuis un fichier CSV
exports.importCSVBlacklist = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fichier CSV requis' });
    }
    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const firstLine = lines[0].toLowerCase();
    const startIndex = (firstLine.includes('nom') || firstLine.includes('prenom')) ? 1 : 0;
    let added = 0;
    let errors = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cols = lines[i].split(/[,;]/).map(c => c.trim());
      if (cols.length < 3) {
        errors.push(`Ligne ${i + 1}: format invalide`);
        continue;
      }
      const nom = cols[0];
      const prenom = cols[1];
      const plaque1 = cols[2] ? cols[2].replace(/\s/g, '').toUpperCase() : null;
      const plaque2 = cols[3] ? cols[3].replace(/\s/g, '').toUpperCase() : null;
      let userId = null;
      if (nom && prenom) {
        const [existingUsers] = await db.query(
          'SELECT id FROM utilisateurs WHERE nom = ? AND prenom = ?',
          [nom, prenom]
        );
        if (existingUsers.length > 0) {
          userId = existingUsers[0].id;
        }
      }
      if (plaque1) {
        try {
          const [existing] = await db.query('SELECT id FROM plaques WHERE numero_plaque = ?', [plaque1]);
          if (existing.length === 0) {
            await db.query(
              "INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 'INTERDITE')",
              [plaque1, userId]
            );
            added++;
          } else {
            await db.query("UPDATE plaques SET statut = 'INTERDITE' WHERE numero_plaque = ?", [plaque1]);
            added++;
          }
        } catch (e) {
          errors.push(`Ligne ${i + 1}: erreur plaque ${plaque1}`);
        }
      }
      if (plaque2) {
        try {
          const [existing] = await db.query('SELECT id FROM plaques WHERE numero_plaque = ?', [plaque2]);
          if (existing.length === 0) {
            await db.query(
              "INSERT INTO plaques (numero_plaque, utilisateurs_id, statut) VALUES (?, ?, 'INTERDITE')",
              [plaque2, userId]
            );
            added++;
          } else {
            await db.query("UPDATE plaques SET statut = 'INTERDITE' WHERE numero_plaque = ?", [plaque2]);
            added++;
          }
        } catch (e) {
          errors.push(`Ligne ${i + 1}: erreur plaque ${plaque2}`);
        }
      }
    }
    await db.query(
      'INSERT INTO logs (action, utilisateurs_id) VALUES (?, ?)',
      [`Import CSV blacklist: ${added} plaques interdites`, req.user.id]
    );
    res.json({
      success: true,
      message: `Import termine: ${added} plaques interdites`,
      data: { added, errors }
    });
  } catch (error) {
    console.error('Erreur lors de l import CSV blacklist:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Exporter les plaques autorisees en CSV
exports.exportCSV = async (req, res) => {
  try {
    const [plaques] = await db.query(`
      SELECT u.nom, u.prenom, p.numero_plaque
      FROM plaques p
      LEFT JOIN utilisateurs u ON p.utilisateurs_id = u.id
      WHERE p.statut = 'AUTORISEE'
      ORDER BY u.nom, u.prenom
    `);
    let csv = 'nom,prenom,plaque\n';
    plaques.forEach(p => {
      csv += `${p.nom || ''},${p.prenom || ''},${p.numero_plaque}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=plaques_autorisees.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erreur lors de l export CSV:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Exporter les plaques non autorisees en CSV
exports.exportCSVBlacklist = async (req, res) => {
  try {
    const [plaques] = await db.query(`
      SELECT u.nom, u.prenom, p.numero_plaque
      FROM plaques p
      LEFT JOIN utilisateurs u ON p.utilisateurs_id = u.id
      WHERE p.statut = 'INTERDITE'
      ORDER BY u.nom, u.prenom
    `);
    let csv = 'nom,prenom,plaque\n';
    plaques.forEach(p => {
      csv += `${p.nom || ''},${p.prenom || ''},${p.numero_plaque}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=plaques_non_autorisees.csv');
    res.send(csv);
  } catch (error) {
    console.error('Erreur lors de l export CSV blacklist:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

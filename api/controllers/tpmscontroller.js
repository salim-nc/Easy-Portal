const db = require('../config/database');

// POST /api/tpms — Recevoir et stocker les données d'un capteur TPMS
exports.addTpmsData = async (req, res) => {
  try {
    const { capteur_id, pression, temperature } = req.body;

    if (!capteur_id || pression === undefined || temperature === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis : capteur_id, pression, temperature'
      });
    }

    await db.query(
      'INSERT INTO tpms_data (capteur_id, pression, temperature) VALUES (?, ?, ?)',
      [capteur_id, pression, temperature]
    );

    console.log(`[TPMS] Donnees recues — capteur: ${capteur_id}, pression: ${pression} kPa, temperature: ${temperature}°C`);

    res.status(201).json({
      success: true,
      message: 'Donnees TPMS enregistrees',
      data: { capteur_id, pression, temperature }
    });
  } catch (error) {
    console.error('Erreur lors de l\'insertion TPMS:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/tpms/verify/:plaque — Vérifier si le capteur TPMS correspond à la plaque
exports.verifyTpms = async (req, res) => {
  try {
    const { plaque } = req.params;
    const plaqueNormalize = plaque.replace(/\s/g, '').toUpperCase();

    // 1. Chercher le capteur_id de reference dans la table plaques
    const [plaques] = await db.query(
      "SELECT capteur_id, numero_plaque FROM plaques WHERE REPLACE(numero_plaque, ' ', '') = ? AND statut = 'AUTORISEE'",
      [plaqueNormalize]
    );

    if (plaques.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plaque non trouvee ou non autorisee'
      });
    }

    const capteurReference = plaques[0].capteur_id;

    if (!capteurReference) {
      return res.status(400).json({
        success: false,
        message: 'Aucun capteur TPMS associe a cette plaque'
      });
    }

    // 2. Chercher le dernier capteur detecte dans tpms_data
    const [tpmsData] = await db.query(
      'SELECT capteur_id, pression, temperature, date_heure FROM tpms_data ORDER BY date_heure DESC LIMIT 1'
    );

    if (tpmsData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucune donnee TPMS recue'
      });
    }

    const capteurDetecte = tpmsData[0].capteur_id;

    // 3. Comparer les deux
    const match = capteurReference === capteurDetecte;

    // 4. Logger le resultat
    await db.query(
      'INSERT INTO logs (action) VALUES (?)',
      [match
        ? `TPMS OK : Plaque ${plaqueNormalize} — capteur ${capteurDetecte} correspond`
        : `ALERTE FRAUDE : Plaque ${plaqueNormalize} — attendu ${capteurReference}, detecte ${capteurDetecte}`
      ]
    );

    res.json({
      success: true,
      verified: match,
      message: match ? 'OK — vehicule verifie' : 'ALERTE FRAUDE — capteur TPMS non conforme',
      data: {
        plaque: plaqueNormalize,
        capteur_reference: capteurReference,
        capteur_detecte: capteurDetecte,
        pression: tpmsData[0].pression,
        temperature: tpmsData[0].temperature,
        date_detection: tpmsData[0].date_heure
      }
    });
  } catch (error) {
    console.error('Erreur lors de la verification TPMS:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
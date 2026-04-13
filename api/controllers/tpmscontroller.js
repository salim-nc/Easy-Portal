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

// POST /api/tpms/verify/:plaque — Vérifier si le capteur TPMS correspond à la plaque
// Reçoit dans le body : { capteur_id_detected } envoyé par detection.py via ZMQ
exports.verifyTpms = async (req, res) => {
  try {
    const { plaque } = req.params;
    const { capteur_id_detected } = req.body; // ID recu par ZMQ depuis detection.py
    const plaqueNormalize = plaque.replace(/\s/g, '').toUpperCase();

    if (!capteur_id_detected) {
      return res.status(400).json({
        success: false,
        message: 'Champ requis : capteur_id_detected'
      });
    }

    // 1. Chercher le capteur_id de reference lie a la plaque en BD
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

    // 2. Comparer l'ID ZMQ recu avec l'ID de reference en BD
    const match = capteurReference === capteur_id_detected;

    // 3. Logger le resultat
    await db.query(
      'INSERT INTO logs (action) VALUES (?)',
      [match
        ? `TPMS OK : Plaque ${plaqueNormalize} — capteur ${capteur_id_detected} correspond`
        : `ALERTE FRAUDE : Plaque ${plaqueNormalize} — attendu ${capteurReference}, detecte ${capteur_id_detected}`
      ]
    );

    res.json({
      success: true,
      verified: match,
      message: match ? 'OK — vehicule verifie' : 'ALERTE FRAUDE — capteur TPMS non conforme',
      data: {
        plaque: plaqueNormalize,
        capteur_reference: capteurReference,
        capteur_detecte: capteur_id_detected
      }
    });

  } catch (error) {
    console.error('Erreur lors de la verification TPMS:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
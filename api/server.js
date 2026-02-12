const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger les requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import des routes (casse exacte)
const authRoutes = require('./routes/authroutes');
const plaqueRoutes = require('./routes/plaqueroutes');
const portalRoutes = require('./routes/portalroutes');
const userRoutes = require('./routes/userroutes');
const logRoutes = require('./routes/logroutes');

// Route de base
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API Easy Portal',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      plaques: '/api/plaques',
      portal: '/api/portal',
      users: '/api/users',
      logs: '/api/logs'
    }
  });
});

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/plaques', plaqueRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/logs', logRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     🚪 EASY PORTAL API SERVER        ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📝 Documentation: http://localhost:${PORT}/api/docs`);
  console.log('');
  console.log('Endpoints disponibles:');
  console.log('  - POST   /api/auth/login/admin');
  console.log('  - POST   /api/auth/login/user');
  console.log('  - POST   /api/auth/register');
  console.log('  - GET    /api/plaques');
  console.log('  - POST   /api/plaques/verify');
  console.log('  - POST   /api/portal/open');
  console.log('  - POST   /api/portal/open-by-plaque');
  console.log('  - GET    /api/users');
  console.log('  - GET    /api/logs');
  console.log('');
});

module.exports = app;

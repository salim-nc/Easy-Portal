const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const app = express();
const PORT = 3000; // Forcé sur le port 3003 comme demandé

// Configuration de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Easy Portal',
      version: '1.0.0',
      description: 'Documentation interactive de l\'API avec support de l\'authentification JWT',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entre ton token JWT sous la forme : <MonToken>',
        },
      },
    },
  },
  apis: ['./routes/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger les requetes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route pour la documentation Swagger (placée avant la 404)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Import des routes
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
      logs: '/api/logs',
      documentation: '/api-docs'
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
    message: 'Route non trouvee'
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

// Demarrage du serveur
app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║     EASY PORTAL API & SWAGGER         ║');
  console.log('╚═══════════════════════════════════════╝');
  console.log(`Serveur demarre sur le port ${PORT}`);
  console.log(`URL locale: http://localhost:${PORT}`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api-docs`);
  console.log('');
});

module.exports = app;
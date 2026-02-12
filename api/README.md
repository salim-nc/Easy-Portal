# 🚪 Easy Portal API

API REST complète pour le système de gestion de portails automatiques avec reconnaissance de plaques d'immatriculation.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Documentation API](#documentation-api)
- [Architecture](#architecture)

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** avec JWT
- 👥 **Gestion des utilisateurs** (admins et utilisateurs standards)
- 🚗 **Gestion des plaques d'immatriculation**
- 🚪 **Contrôle du portail** (ouverture manuelle et automatique)
- 📊 **Système de logs** complet avec statistiques
- 🔍 **Vérification de plaques** pour le système de reconnaissance
- 📱 Compatible avec applications Android et site web

## 🛠 Technologies

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de données
- **JWT** - Authentification
- **bcryptjs** - Hashage des mots de passe
- **CORS** - Gestion des requêtes cross-origin

## 📦 Installation

### Prérequis

- Node.js (v14 ou supérieur)
- MySQL (v5.7 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
cd easy-portal-api
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
```bash
mysql -u root -p < database/init.sql
```

4. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer le fichier .env avec vos paramètres
```

## ⚙️ Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=easy_portal
DB_PORT=3306

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=24h

# Serveur
PORT=3000
NODE_ENV=development

# Portail (URL du contrôleur)
PORTAL_CONTROLLER_URL=http://192.168.1.100/open
```

## 🚀 Démarrage

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

## 📚 Documentation API

### Base URL
```
http://localhost:3000/api
```

### 🔐 Authentification

#### Connexion Administrateur
```http
POST /api/auth/login/admin
Content-Type: application/json

{
  "email": "admin@easyportal.com",
  "password": "admin123"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nom": "Admin",
      "prenom": "Système",
      "email": "admin@easyportal.com",
      "role": "admin"
    }
  }
}
```

#### Connexion Utilisateur
```http
POST /api/auth/login/user
Content-Type: application/json

{
  "email": "jean.dupont@example.com",
  "password": "user123"
}
```

#### Créer un utilisateur (Admin uniquement)
```http
POST /api/auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Nouveau",
  "prenom": "Utilisateur",
  "email": "nouveau@example.com",
  "password": "password123",
  "telephone": "0612345678"
}
```

### 🚗 Gestion des plaques

#### Obtenir toutes les plaques (Admin)
```http
GET /api/plaques
Authorization: Bearer {token}
```

#### Vérifier une plaque (Système de reconnaissance)
```http
POST /api/plaques/verify
Content-Type: application/json

{
  "numero": "AB-123-CD"
}
```

**Réponse:**
```json
{
  "success": true,
  "authorized": true,
  "message": "Accès autorisé",
  "data": {
    "plaque": {
      "id": 1,
      "numero": "AB-123-CD",
      "user_id": 1,
      "description": "Véhicule principal",
      "active": 1
    }
  }
}
```

#### Ajouter une plaque (Admin)
```http
POST /api/plaques
Authorization: Bearer {token}
Content-Type: application/json

{
  "numero": "XY-999-ZZ",
  "user_id": 1,
  "description": "Nouveau véhicule"
}
```

#### Modifier une plaque (Admin)
```http
PUT /api/plaques/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "numero": "XY-999-AA",
  "description": "Description modifiée",
  "active": 1
}
```

#### Supprimer une plaque (Admin)
```http
DELETE /api/plaques/{id}
Authorization: Bearer {token}
```

#### Obtenir les plaques d'un utilisateur
```http
GET /api/plaques/user/{userId}
Authorization: Bearer {token}
```

### 🚪 Contrôle du portail

#### Ouvrir le portail manuellement (Utilisateur authentifié)
```http
POST /api/portal/open
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Visite client"
}
```

#### Ouvrir le portail automatiquement (Reconnaissance)
```http
POST /api/portal/open-by-plaque
Content-Type: application/json

{
  "numero": "AB-123-CD"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Portail ouvert avec succès",
  "authorized": true,
  "data": {
    "plaque": "AB-123-CD",
    "opened_at": "2024-02-10T14:30:00.000Z"
  }
}
```

#### Obtenir le statut du portail
```http
GET /api/portal/status
Authorization: Bearer {token}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "recent_activity": [...],
    "today_stats": {
      "total_ouvertures": 15,
      "ouvertures_auto": 10,
      "ouvertures_manuelles": 5,
      "acces_refuses": 2
    }
  }
}
```

### 👥 Gestion des utilisateurs

#### Obtenir tous les utilisateurs (Admin)
```http
GET /api/users
Authorization: Bearer {token}
```

#### Obtenir un utilisateur par ID (Admin)
```http
GET /api/users/{id}
Authorization: Bearer {token}
```

#### Obtenir son propre profil
```http
GET /api/users/me
Authorization: Bearer {token}
```

#### Modifier un utilisateur (Admin)
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Nouveau nom",
  "prenom": "Nouveau prénom",
  "email": "nouveau.email@example.com",
  "telephone": "0612345678"
}
```

#### Modifier son propre profil
```http
PUT /api/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Mon nouveau nom",
  "old_password": "ancien_mdp",
  "password": "nouveau_mdp"
}
```

#### Supprimer un utilisateur (Admin)
```http
DELETE /api/users/{id}
Authorization: Bearer {token}
```

### 📊 Logs et statistiques

#### Obtenir tous les logs (Admin)
```http
GET /api/logs?page=1&limit=50&type=ouverture_automatique
Authorization: Bearer {token}
```

#### Obtenir les logs par type (Admin)
```http
GET /api/logs/type/{type}?limit=100
Authorization: Bearer {token}
```

Types disponibles:
- `connexion`
- `ouverture_manuelle`
- `ouverture_automatique`
- `acces_refuse`
- `ajout_plaque`
- `modification_plaque`
- `suppression_plaque`

#### Obtenir les statistiques (Admin)
```http
GET /api/logs/stats?period=today
Authorization: Bearer {token}
```

Périodes disponibles: `today`, `week`, `month`, `all`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "general": {
      "total_logs": 45,
      "ouvertures_auto": 20,
      "ouvertures_manuelles": 10,
      "acces_refuses": 5,
      "connexions": 10
    },
    "by_type": [...],
    "top_users": [...],
    "top_plaques": [...],
    "hourly_activity": [...]
  }
}
```

#### Obtenir les logs d'un utilisateur (Admin)
```http
GET /api/logs/user/{userId}?limit=50
Authorization: Bearer {token}
```

#### Obtenir les logs d'une plaque (Admin)
```http
GET /api/logs/plaque/{plaqueId}?limit=50
Authorization: Bearer {token}
```

#### Nettoyer les anciens logs (Admin)
```http
DELETE /api/logs/clean
Authorization: Bearer {token}
Content-Type: application/json

{
  "days": 90
}
```

## 🏗 Architecture

```
easy-portal-api/
├── config/
│   └── database.js          # Configuration MySQL
├── controllers/
│   ├── authController.js    # Authentification
│   ├── plaqueController.js  # Gestion des plaques
│   ├── portalController.js  # Contrôle du portail
│   ├── userController.js    # Gestion des utilisateurs
│   └── logController.js     # Gestion des logs
├── middleware/
│   └── auth.js              # Middleware JWT
├── routes/
│   ├── authRoutes.js        # Routes d'authentification
│   ├── plaqueRoutes.js      # Routes des plaques
│   ├── portalRoutes.js      # Routes du portail
│   ├── userRoutes.js        # Routes des utilisateurs
│   └── logRoutes.js         # Routes des logs
├── database/
│   └── init.sql             # Script d'initialisation
├── .env.example             # Exemple de configuration
├── package.json
├── server.js                # Point d'entrée
└── README.md
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- Authentification JWT avec expiration
- Validation des entrées
- Protection contre les injections SQL (requêtes préparées)
- CORS configuré
- Middleware d'autorisation (admin/user)

## 📝 Notes importantes

### Compte administrateur par défaut
- **Email:** admin@easyportal.com
- **Mot de passe:** admin123
- ⚠️ **À changer immédiatement en production !**

### Comptes utilisateurs de test
- **Email:** jean.dupont@example.com / **Mot de passe:** user123
- **Email:** sophie.martin@example.com / **Mot de passe:** user123

### Intégration hardware

Le contrôleur du portail est actuellement configuré pour fonctionner via HTTP. Vous devez adapter la fonction `openPortalHardware()` dans `controllers/portalController.js` selon votre matériel:

- **GPIO (Raspberry Pi):** Utiliser une bibliothèque comme `onoff`
- **Contrôleur HTTP:** Modifier l'URL dans `.env`
- **Port série:** Utiliser `serialport`
- **Autre:** Adapter selon votre système

## 🐛 Débogage

Pour activer les logs détaillés:
```bash
NODE_ENV=development npm run dev
```

## 📞 Support

Pour toute question ou problème, veuillez créer une issue sur le dépôt GitHub.

## 📄 Licence

Ce projet est sous licence MIT.

---

Développé avec ❤️ pour Easy Portal
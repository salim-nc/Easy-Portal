[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=22187699&assignment_repo_type=AssignmentRepo)

# 🚗 EasyPortal - Système d'Accès Parking Intelligent (Projet 2026)

## 📝 Description du Projet

**EasyPortal** est une solution de gestion d'accès automatisée développée pour le parking du **Lycée Jean Rostand** à Villepinte. Le système utilise la reconnaissance de plaques d'immatriculation (LPR) via un flux vidéo de caméra IP pour autoriser l'accès automatique au personnel. Il offre également une gestion flexible pour les intervenants extérieurs via une application mobile Android.

## 🛠️ Architecture Technique

Le système repose sur trois services Docker orchestrés via Docker Compose, tous connectés sur un réseau interne `easyportal-network` :

- **`api`** — Serveur Node.js / Express.js (port 3000) qui centralise la logique métier : vérification des plaques, gestion des utilisateurs, journalisation des accès et authentification JWT.
- **`camera`** — Service Python (port 8000) qui capture le flux vidéo de la caméra IP et le diffuse en MJPEG sur le réseau interne.
- **`portail`** — Service Python (port 5000) qui tourne sur la Raspberry Pi 4, analyse le flux vidéo avec FastAlpr (YOLOv8-tiny + PaddleOCR), interroge l'API, et commande l'ouverture du portail via Arduino sur le port série `/dev/ttyACM0`.

La base de données MySQL est hébergée séparément et accessible via les variables d'environnement configurées dans `./api/.env`.

## 👥 Répartition de l'Équipe (BTS CIEL IR)

| Étudiant | Rôle Principal | Missions Clés |
| :--- | :--- | :--- |
| **Étudiant 1** | **API & Base de données** | Développement de l'API REST Node.js, modélisation de la BDD, gestion des logs et imports/exports CSV. |
| **Étudiant 2** | **Vision & Détection** | Programme de détection Python avec FastAlpr, vote majoritaire sur plusieurs frames, communication série avec l'Arduino. |
| **Étudiant 3** | **Hardware & Vidéo** | Montage du portail, pilotage moteur MCC, soudage de la carte de puissance et flux vidéo IP. |
| **Étudiant 4** | **Application Mobile** | Développement de l'application Android Studio, authentification et gestion des modes Total/Réduit. |

## 🚀 Lancement du Projet (Docker)

### Prérequis

- Une Raspberry Pi 4 sous Raspberry Pi OS.
- Une caméra IP accessible sur le réseau local.
- Un Arduino connecté sur `/dev/ttyACM0`.
- MySQL configuré et accessible (en local ou sur le réseau).

### 0. Installer Docker sur la Raspberry Pi

Si Docker n'est pas encore installé, exécuter la commande officielle suivante :

```bash
curl -fsSL https://get.docker.com | sh
```

Cette commande installe automatiquement Docker Engine ainsi que Docker Compose sur Raspberry Pi OS. Une fois l'installation terminée, ajouter l'utilisateur courant au groupe Docker pour éviter d'avoir à utiliser `sudo` à chaque commande :

```bash
sudo usermod -aG docker $USER
```

Puis redémarrer la session pour que le changement soit pris en compte.

### 1. Configurer l'environnement

Créer le fichier `.env` dans le dossier `api/` à partir de l'exemple fourni :

```bash
cp api/.env.example api/.env
```

Puis renseigner les variables dans `api/.env` :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=easy_portal
JWT_SECRET=votre_secret_jwt
PORT=3000
```

### 2. Initialiser la base de données

```bash
mysql -u root -p < api/database/init.sql
```

### 3. Lancer tous les services

```bash
docker compose up --build
```

Cette commande construit les trois images Docker (`api`, `camera`, `portail`) et démarre les services. Au premier lancement, FastAlpr télécharge automatiquement les modèles YOLOv8-tiny et PaddleOCR.

Pour lancer en arrière-plan :

```bash
docker compose up --build -d
```

Pour arrêter tous les services :

```bash
docker compose down
```

### 4. Vérifier que les services sont actifs

```bash
docker compose ps
```

Les trois conteneurs `easyportal-api`, `easyportal-camera` et `easyportal-portail` doivent apparaître avec le statut `running`.

## 📊 Fonctionnalités Principales

- **Reconnaissance LPR :** Ouverture automatique pour les véhicules autorisés en base de données, avec vote majoritaire sur plusieurs frames pour fiabiliser la lecture.
- **Modes d'Accès :** Distinction entre accès "Total" (ouverture pour tout véhicule) et "Réduit" (uniquement véhicule lié au compte).
- **API REST sécurisée :** Authentification JWT, requêtes préparées anti-injection SQL, gestion des rôles admin/utilisateur.
- **Supervision :** Interface pour gérer les plaques autorisées (import/export CSV) et consulter l'historique des passages.
- **Sécurité :** Liste noire des véhicules interdits et journalisation complète des événements.

## 🔄 Flux de Fonctionnement

```
Capteur IR → Arduino → Service portail (FastAlpr)
                              ↓
                    API Node.js /api/plaques/verify
                              ↓
                      MySQL (vérification)
                              ↓
             Autorisé → Arduino → Ouverture portail
             Refusé  → Log + Aucune action
```

## 📁 Structure du Projet

```
easyportal/
├── api/                     # Service API Node.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   ├── config/
│   ├── server.js
│   ├── .env
│   └── Dockerfile
├── camera/                  # Service flux vidéo
│   ├── camera_stream.py
│   └── Dockerfile
├── portail/                 # Service détection FastAlpr
│   ├── detection.py
│   ├── start.py
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 📄 Schéma électronique

[easyportal_montage.pdf](https://github.com/user-attachments/files/27903904/easyportal_montage.pdf)

---
*Projet technique E6 - Académies de Créteil, Paris, Versailles - Session 2025/2026.*
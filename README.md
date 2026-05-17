[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=22187699&assignment_repo_type=AssignmentRepo)
# 26
projets 2026
# 🚗 EasyPortal - Système d'Accès Parking Intelligent (Projet 2026)

[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=22187699&assignment_repo_type=AssignmentRepo)

## 📝 Description du Projet
**EasyPortal** est une solution de gestion d'accès automatisée développée pour le parking du **Lycée Jean Rostand** à Villepinte. Le système utilise la reconnaissance de plaques d'immatriculation (LPR) via un flux vidéo de caméra IP pour autoriser l'accès automatique au personnel. Il offre également une gestion flexible pour les intervenants extérieurs via une application mobile Android.

## 🛠️ Architecture Technique
Le système repose sur une infrastructure réseau distribuée :
* **Système Embarqué :** Raspberry Pi gérant la librairie OpenCV pour le traitement d'image et un serveur TCP/IP pour les commandes d'ouverture.
* **Serveur Central :** Serveur HTTP Apache et base de données MySQL pour la centralisation des autorisations et des logs.
* **Contrôle Hardware :** Portail didactisé piloté par un moteur à courant continu (MCC) avec carte de puissance et signalisation lumineuse.
* **Connectivité :** Liaison Wi-Fi/Ethernet pour le réseau local et clé 3G pour l'accès distant.

## 👥 Répartition de l'Équipe (BTS CIEL IR)
| Étudiant | Rôle Principal | Missions Clés |
| :--- | :--- | :--- |
| **Étudiant 1** | **Admin Web & BDD** | Modélisation de la BDD, site web d'administration, gestion des logs et imports/exports CSV. |
| **Étudiant 2** | **Vision & Réseau** | Détection de véhicules, lecture de plaques via OpenCV et développement du serveur TCP/IP. |
| **Étudiant 3** | **Hardware & Vidéo** | Montage du portail, pilotage moteur MCC, soudage de la carte de puissance et flux vidéo IP. |
| **Étudiant 4** | **Application Mobile** | Développement de l'application Android Studio, authentification et gestion des modes Total/Réduit. |

## 🚀 Guide d'Installation & Configuration
### 1. Base de Données (MySQL)
* Importer le schéma SQL via **MySQL Workbench**.
* Configurer les privilèges pour permettre la connexion distante de la Raspberry Pi et de l'application mobile.

### 2. Traitement d'Image (OpenCV)
* Installer OpenCV sur la Raspberry Pi (environnement Linux).
* Configurer le script pour analyser le flux RTSP/MJPEG de la caméra IP installée à l'entrée.

### 3. Application Mobile
* Compiler le projet avec **Android Studio**.
* S'assurer que la tablette est connectée au même réseau que le serveur ou via la passerelle 3G.

## 📊 Fonctionnalités Principales
* **Reconnaissance LPR :** Ouverture automatique pour les véhicules autorisés en base de données.
* **Modes d'Accès :** Distinction entre accès "Total" (ouverture pour tout véhicule) et "Réduit" (uniquement véhicule lié au compte).
* **Supervision Web :** Interface pour gérer les plaques autorisées (import CSV) et consulter l'historique des passages.
* **Sécurité :** Liste noire des véhicules interdits et journalisation complète des événements.
  
### 4.Schéma éléctronique
[easyportal_montage.pdf](https://github.com/user-attachments/files/27903904/easyportal_montage.pdf)

---
*Projet technique E6 - Académies de Créteil, Paris, Versailles - Session 2025/2026.*

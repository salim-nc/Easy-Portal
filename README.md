# EasyPortal

Système de contrôle d'accès de portail par **plaque d'immatriculation** : une interface web d'administration, une API REST et une base de données MySQL.

Le système vérifie si un véhicule est autorisé à entrer, enregistre chaque tentative d'accès et permet aux administrateurs de gérer les plaques (autorisées ou interdites), de consulter l'historique et d'ouvrir le portail à distance.


---

## Fonctionnalités

- **Authentification** par jeton JWT, avec déconnexion automatique après 30 minutes d'inactivité
- **Gestion des plaques** : ajout, modification, suppression et statut `AUTORISEE` ou `INTERDITE` (format accepté par l'interface : lettres, chiffres et tirets, 2 à 10 caractères, par ex. `AB-123-CD`)
- **Attribution d'une plaque à un utilisateur** (optionnelle) et association à un **capteur TPMS** (identifiant hexadécimal, par ex. `0xa3f1c7`)
- **Vérification d'une plaque** : réponse « accès autorisé » ou « accès refusé », enregistrée dans les logs
- **Import / export CSV** des plaques autorisées et de la liste noire (plaques interdites)
- **Journal d'activité** : date, utilisateur, action
- **Ouverture manuelle du portail** depuis l'interface
- **Suivi des actions** de l'interface (boutons portant l'attribut `data-track`)

---

## Architecture

```
┌──────────────┐          ┌──────────────┐          ┌─────────────────┐
│  Site web    │ ───────▶ │  Node.js     │ ───────▶ │  MySQL          │
│  (admin)     │ ◀─────── │  (Docker)    │ ◀─────── │  EasyPortal2026 │
└──────────────┘          └──────────────┘          └─────────────────┘
```

| Couche | Technologie | Détails |
|---|---|---|
| Front-end | HTML, CSS, JavaScript | Pages statiques ; appels à l'API via `apiRequest()` (`assets/js/app.js`) |
| Back-end | Node.js (Express) | API REST dans le conteneur Docker `easyportal-api`, connexion MySQL via `mysql2` |
| Base de données | MySQL | Base `EasyPortal2026` |

Partie matérielle (lecteur de plaques, récepteur de capteurs TPMS, commande du portail) : **[À COMPLÉTER]**

---

## Structure du projet

**Site web (front-end)**

```
├── index.html              # page d'accueil (publique)
├── login.html              # connexion
├── dashboard.html          # tableau de bord
├── gestion-plaques.html    # gestion des plaques
├── a-propos.html           # page publique
├── logo-siteweb.png
└── assets/
    ├── css/
    │   └── style.css
    └── js/
        ├── config.js            # définit API_BASE (URL de l'API)
        ├── app.js               # apiRequest(), authentification, logs, ouverture du portail
        ├── activity.js          # suivi des actions
        └── gestion-plaques.js   # gestion des plaques (page gestion-plaques.html)
```

**API (back-end)**

```
├── config/
│   └── database.js              # connexion MySQL (pool mysql2)
├── controllers/
│   └── plaquecontroller.js      # logique métier des plaques
└── …                            # routes, middlewares, serveur : [À COMPLÉTER]
```

---

## Prérequis

- Docker et Docker Compose
- Un navigateur récent
- Sans Docker : Node.js (LTS) et un serveur MySQL

---

## Installation et lancement

### 1. Récupérer le projet

```bash
git clone <URL_DU_DEPOT>
cd <NOM_DU_DEPOT>
```

### 2. Démarrer l'API

```bash
docker compose up -d --build
```

Vérifier que l'API tourne :

```bash
docker ps
docker logs easyportal-api --tail 50
```

### 3. Créer la base de données

Importer le script de création des tables (`utilisateurs`, `plaques`, `logs`) : **[À COMPLÉTER]** (ajouter le fichier `.sql` au dépôt et indiquer la commande d'import).

### 4. Configurer et ouvrir le site web

Dans `assets/js/config.js`, renseigner l'URL de l'API (elle se termine par `/api`) :

```js
const API_BASE = "http://<ADRESSE_DU_SERVEUR>:<PORT>/api";
```

Servir ensuite le dossier du site avec un serveur web (Nginx, Apache ou `npx serve`), puis ouvrir `index.html` dans le navigateur.

### 5. Premier compte administrateur

**[À COMPLÉTER]**

---

## Configuration

La connexion MySQL est définie dans `config/database.js`. Variables d'environnement à documenter (hôte, utilisateur, mot de passe, base `EasyPortal2026`, secret JWT, port de l'API) : **[À COMPLÉTER]**

---

## Base de données

| Table | Colonnes principales | Remarques |
|---|---|---|
| `utilisateurs` | `id`, `nom`, `prenom`, `email`, … | Autres colonnes : **[À COMPLÉTER]** |
| `plaques` | `id`, `numero_plaque`, `utilisateurs_id`, `capteur_id`, `statut` | `statut` vaut `AUTORISEE` ou `INTERDITE` ; `utilisateurs_id` et `capteur_id` sont facultatifs |
| `logs` | `id`, `action`, `utilisateurs_id`, `plaques_id`, date/heure | `utilisateurs_id` et `plaques_id` sont facultatifs |

Relations :

- Une plaque appartient à zéro ou un utilisateur ; un utilisateur peut avoir plusieurs plaques.
- Un log peut être rattaché à une plaque et/ou à un utilisateur.
- Contrainte `fk_logs_plaques1` : `logs.plaques_id` référence `plaques.id` (`ON DELETE NO ACTION`).

---

## API REST

URL de base : `http://<hôte>:<port>/api`

L'interface appelle toutes les routes ci-dessous avec l'en-tête `Authorization: Bearer <token>`. Les réponses sont en JSON, de la forme `{ "success": true, "data": … }` ou `{ "success": false, "message": "…" }`.

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/auth/verify` | Vérifie que le jeton JWT est valide |
| `GET` | `/users` | Liste des utilisateurs |
| `GET` | `/plaques` | Liste des plaques avec leur propriétaire |
| `POST` | `/plaques` | Ajoute une plaque (créée avec le statut `AUTORISEE`). Corps : `{ numero, utilisateurs_id?, capteur_id? }`. Réponses : `201` créée, `409` plaque déjà existante, `404` utilisateur inconnu |
| `PUT` | `/plaques/:id` | Modifie une plaque. Corps : `{ numero?, utilisateurs_id?, statut?, capteur_id? }` |
| `DELETE` | `/plaques/:id` | Supprime une plaque et les logs qui lui sont liés |
| `GET` | `/logs` | Journal des événements |
| `POST` | `/portal/open` | Ouvre le portail |
| `POST` | `/activity` | Enregistre une action de l'interface. Corps : `{ action }` |

Autres fonctions du contrôleur des plaques (chemins exacts des routes : **[À COMPLÉTER]**) :

| Fonction | Rôle |
|---|---|
| `verifyPlaque` | Reçoit `{ numero }` (espaces retirés, mis en majuscules), répond `{ success, authorized, message, data }` et écrit un log « accès autorisé » ou « accès refusé » |
| `getPlaqueByNumber` | Retourne une plaque à partir de son numéro |
| `getPlaquesByUser` | Liste les plaques d'un utilisateur |
| `importCSV` / `importCSVBlacklist` | Import CSV des plaques autorisées / interdites |
| `exportCSV` / `exportCSVBlacklist` | Export CSV des plaques autorisées / interdites |

Connexion (`login`) et gestion des comptes : **[À COMPLÉTER]**

---

## Import / export CSV

**Import** (plaques autorisées ou liste noire) :

```csv
nom,prenom,plaque1,plaque2
Dupont,Jean,AB123CD,EF456GH
Martin,Claire,IJ789KL,
```

- Séparateur `,` ou `;`
- L'en-tête est facultatif (détecté si la première ligne contient « nom » ou « prenom »)
- Au moins 3 colonnes par ligne ; `plaque2` est facultative
- Les plaques sont normalisées (espaces retirés, majuscules)
- L'utilisateur est retrouvé par son nom et son prénom ; s'il n'existe pas, la plaque est créée sans propriétaire
- Import « autorisées » : les plaques déjà présentes sont ignorées
- Import « liste noire » : les plaques sont créées en `INTERDITE`, ou passées en `INTERDITE` si elles existent déjà

**Export** : fichier CSV au format `nom,prenom,plaque` (`plaques_autorisees.csv` ou `plaques_non_autorisees.csv`).

---

## Sécurité

- Jeton JWT envoyé dans l'en-tête `Authorization`, vérifié au chargement des pages protégées ; redirection vers `login.html` si le jeton est absent, expiré ou invalide (réponses `401` / `403`)
- Déconnexion automatique après 30 minutes d'inactivité
- Échappement des données affichées (`sanitizeHTML`) pour limiter les failles XSS
- Requêtes SQL paramétrées côté API pour limiter les injections SQL
- Validation du format des plaques côté interface (`isValidPlate`)
- En-tête `X-Requested-With` ajouté à chaque requête

---

## Dépannage

| Symptôme | Cause et solution |
|---|---|
| Erreur 500 à la suppression d'une plaque (`ER_ROW_IS_REFERENCED_2`) | La contrainte `fk_logs_plaques1` interdit de supprimer une plaque qui a des logs. `deletePlaque` supprime donc d'abord ses logs. Pour conserver l'historique, on peut passer la contrainte en `ON DELETE SET NULL`. |
| « Impossible de joindre le serveur API » | `API_BASE` incorrect ou conteneur arrêté : vérifier `assets/js/config.js` et `docker ps` |
| Redirection vers `login.html` | Jeton absent, expiré ou invalide, ou plus de 30 minutes d'inactivité : se reconnecter |
| Une modification de l'API n'a aucun effet | Reconstruire l'image : `docker compose build easyportal-api && docker compose up -d easyportal-api` |
| Comprendre une erreur 500 | Lire les logs : `docker logs easyportal-api --tail 50` |

---


## Licence
Tous droits réservés.

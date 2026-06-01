-- Script d'initialisation de la base de données Easy Portal

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS easy_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE easy_portal;

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS administrateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des plaques d'immatriculation
CREATE TABLE IF NOT EXISTS plaques (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    user_id INT,
    description TEXT,
    active TINYINT(1) DEFAULT 1,
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_user_id (user_id),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des logs d'activité
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    user_id INT,
    plaque_id INT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (plaque_id) REFERENCES plaques(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_user_id (user_id),
    INDEX idx_plaque_id (plaque_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion d'un administrateur par défaut (mot de passe: admin123)
-- Hash bcrypt du mot de passe 'admin123'
INSERT INTO administrateurs (nom, prenom, email, password) 
VALUES ('Admin', 'Système', 'admin@easyportal.com', '$2a$10$rI7TkQH0XEjE.jH8JD7Vvuo8xU6YM9N3VzXNXxNxNxNxNxNxNxNxN');

-- Insertion de quelques utilisateurs de test (mot de passe: user123)
-- Hash bcrypt du mot de passe 'user123'
INSERT INTO utilisateurs (nom, prenom, email, password, telephone) VALUES
('Dupont', 'Jean', 'jean.dupont@example.com', '$2a$10$rI7TkQH0XEjE.jH8JD7Vvuo8xU6YM9N3VzXNXxNxNxNxNxNxNxNxN', '0601020304'),
('Martin', 'Sophie', 'sophie.martin@example.com', '$2a$10$rI7TkQH0XEjE.jH8JD7Vvuo8xU6YM9N3VzXNXxNxNxNxNxNxNxNxN', '0605060708');

-- Insertion de quelques plaques de test
INSERT INTO plaques (numero, user_id, description, active) VALUES
('AB-123-CD', 1, 'Véhicule principal de Jean', 1),
('EF-456-GH', 1, 'Véhicule secondaire de Jean', 1),
('IJ-789-KL', 2, 'Véhicule de Sophie', 1),
('MN-012-OP', NULL, 'Véhicule visiteur', 1);

-- Insertion de quelques logs de test
INSERT INTO logs (type, description, user_id) VALUES
('connexion', 'Connexion administrateur: admin@easyportal.com', NULL),
('connexion', 'Connexion utilisateur: jean.dupont@example.com', 1);

-- Affichage des données insérées
SELECT 'Administrateurs créés:' as '';
SELECT id, nom, prenom, email FROM administrateurs;

SELECT 'Utilisateurs créés:' as '';
SELECT id, nom, prenom, email FROM utilisateurs;

SELECT 'Plaques créées:' as '';
SELECT id, numero, user_id, description FROM plaques;

SELECT 'Base de données Easy Portal initialisée avec succès!' as '';
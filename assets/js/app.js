// ==============================
// SÉCURITÉ - Fonction pour nettoyer les données (prévention XSS)
// ==============================
function sanitizeHTML(str) {
    if (!str) return "";
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ==============================
// SÉCURITÉ - Vérifier si le token existe et valider
// ==============================
function checkTokenValidity() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("Pas de token trouvé. Redirection vers login.");
        window.location.replace("login.html");
        return false;
    }
    return true;
}

// ==============================
// REQUÊTE API GÉNÉRIQUE SÉCURISÉE
// ==============================
async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
    // Vérifier que l'endpoint est valide
    if (!endpoint || !endpoint.startsWith("/")) {
        throw new Error("Endpoint invalide");
    }

    const headers = { 
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest" // Prévention CSRF
    };

    // ==============================
    // SÉCURITÉ - Ajouter le token JWT si authentification requise
    // ==============================
    if (auth) {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("Token manquant. Redirection vers login.");
            window.location.replace("login.html");
            throw new Error("Non authentifié");
        }
        headers["Authorization"] = "Bearer " + token;
    }

    const options = {
        method,
        headers,
    };

    // ==============================
    // SÉCURITÉ - Valider et sérialiser le body
    // ==============================
    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        try {
            options.body = JSON.stringify(body);
        } catch (err) {
            throw new Error("Impossible de sérialiser les données");
        }
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);

        // Lire la réponse
        const data = await response.json().catch(() => null);

        // ==============================
        // SÉCURITÉ - Gérer les erreurs 401/403 (token expiré)
        // ==============================
        if (response.status === 401 || response.status === 403) {
            console.warn("Token expiré ou invalide. Redirection vers login.");
            localStorage.removeItem("token");
            window.location.replace("login.html");
            throw new Error("Session expirée");
        }

        if (!response.ok) {
            const message = (data && (data.message || data.error)) || "Erreur API (" + response.status + ")";
            console.error("API Error:", response.status, message);
            throw new Error(message);
        }

        return data;
    } catch (err) {
        // Gestion des erreurs réseau
        if (err.name === "TypeError" && err.message === "Failed to fetch") {
            console.error("Erreur réseau: Impossible de joindre l'API.");
            throw new Error("Impossible de joindre le serveur API.");
        }
        throw err;
    }
}

// ==============================
// DOM READY - INITIALISATION SÉCURISÉE
// ==============================
document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // SÉCURITÉ - Vérifier le token au chargement
    // ==============================
    const token = localStorage.getItem("token");
    if (!token) {
        // ==============================
        // CORRECTION - Inclure "/" pour la racine du site
        // ==============================
        const path = window.location.pathname;
        const isPublic = path === "/" ||
                         path.includes("index.html") ||
                         path.includes("login.html") ||
                         path.includes("a-propos.html");

        if (!isPublic) {
            console.warn("Accès non autorisé. Redirection vers login.");
            window.location.replace("login.html");
        }
    }

    // ==============================
    // GESTION DE LA DÉCONNEXION
    // ==============================
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            // Supprimer le token de manière sécurisée
            localStorage.removeItem("token");
            // Redirection sécurisée
            window.location.replace("index.html");
        });
    }

    // ==============================
    // SÉCURITÉ - Tracking automatique des actions
    // ==============================
    if (token) {
        document.querySelectorAll("button[data-track]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const actionName = sanitizeHTML(btn.getAttribute("data-track")) || "action_inconnue";
                try {
                    await apiRequest("/activity", "POST", { action: actionName }, true);
                } catch (err) {
                    console.error("Erreur tracking:", err);
                    // Silencieux - ne pas bloquer l'action
                }
            });
        });
    }
});

// ==============================
// VÉRIFICATION DU TOKEN
// ==============================
async function verifyToken() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.replace("login.html");
        return false;
    }

    try {
        await apiRequest("/auth/verify", "GET", null, true);
        return true;
    } catch (err) {
        console.error("Token invalide:", err);
        localStorage.removeItem("token");
        window.location.replace("login.html");
        return false;
    }
}

// ==============================
// OUVERTURE PORTAIL SÉCURISÉE
// ==============================
async function openPortal() {
    // Vérifier l'authentification
    if (!checkTokenValidity()) return;

    try {
        await apiRequest("/portal/open", "POST", null, true);
        console.log("Portail ouvert avec succès");
    } catch (err) {
        console.error("Erreur ouverture portail:", err);
        alert("Erreur : " + sanitizeHTML(err.message));
    }
}

// ==============================
// CHARGEMENT DES LOGS SÉCURISÉ
// ==============================
async function loadLogs() {
    // Vérifier l'authentification
    if (!checkTokenValidity()) return;

    try {
        const data = await apiRequest("/logs", "GET", null, true);

        const tableBody = document.querySelector("#logsTable tbody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        const logsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);

        logsArray.forEach(log => {
            const tr = document.createElement("tr");
            // ==============================
            // SÉCURITÉ - Sanitizer les données avant insertion dans le DOM
            // ==============================
            tr.innerHTML = 
                "<td>" + sanitizeHTML(log.date || "") + "</td>" +
                "<td>" + sanitizeHTML(log.user || "") + "</td>" +
                "<td>" + sanitizeHTML(log.action || "") + "</td>";
            tableBody.appendChild(tr);
        });

    } catch (err) {
        console.error("Erreur chargement logs:", err);
        alert("Impossible de charger les logs.");
    }
}

// ==============================
// AFFICHAGE DES MESSAGES - MODIFIÉ POUR RESTER LONGTEMPS
// ==============================
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.className = `message ${type}`;

    // Les messages restent 30 secondes (30000 ms)
    setTimeout(() => {
        el.className = "message";
    }, 30000);
}

// ==============================
// SÉCURITÉ - Déconnexion automatique après inactivité
// ==============================
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    
    const token = localStorage.getItem("token");
    if (token) {
        inactivityTimer = setTimeout(() => {
            console.warn("Session expirée par inactivité");
            localStorage.removeItem("token");
            window.location.replace("login.html");
        }, INACTIVITY_TIMEOUT);
    }
}

// Réinitialiser le timer sur chaque interaction
if (localStorage.getItem("token")) {
    document.addEventListener("click", resetInactivityTimer);
    document.addEventListener("keypress", resetInactivityTimer);
    document.addEventListener("mousemove", resetInactivityTimer);
    resetInactivityTimer();
}
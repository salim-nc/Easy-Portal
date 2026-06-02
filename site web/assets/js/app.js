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
    if (!endpoint || !endpoint.startsWith("/")) {
        throw new Error("Endpoint invalide");
    }

    const headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest"
    };

    if (auth) {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("Token manquant. Redirection vers login.");
            window.location.replace("login.html");
            throw new Error("Non authentifié");
        }
        headers["Authorization"] = "Bearer " + token;
    }

    const options = { method, headers };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        try {
            options.body = JSON.stringify(body);
        } catch (err) {
            throw new Error("Impossible de sérialiser les données");
        }
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);
        const data = await response.json().catch(() => null);

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

    const token = localStorage.getItem("token");
    if (!token) {
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

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.replace("index.html");
        });
    }

    if (token) {
        document.querySelectorAll("button[data-track]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const actionName = sanitizeHTML(btn.getAttribute("data-track")) || "action_inconnue";
                try {
                    await apiRequest("/activity", "POST", { action: actionName }, true);
                } catch (err) {
                    console.error("Erreur tracking:", err);
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
// MODIFIÉ : on laisse l'erreur remonter (throw)
// pour que handleOpenPortal() dans dashboard.html puisse l'attraper.
async function openPortal() {
    if (!checkTokenValidity()) throw new Error("Non authentifié");

    // Appel API — l'erreur éventuelle remonte au caller
    await apiRequest("/portal/open", "POST", null, true);
    console.log("Portail ouvert avec succès");
}

// ==============================
// CHARGEMENT DES LOGS SÉCURISÉ
// ==============================
async function loadLogs() {
    if (!checkTokenValidity()) return;

    try {
        const data = await apiRequest("/logs", "GET", null, true);

        const tableBody = document.querySelector("#logsTable tbody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        const logsArray = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);

        logsArray.forEach(log => {
            const tr = document.createElement("tr");
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
// AFFICHAGE DES MESSAGES
// ==============================
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.className = `message ${type}`;

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

if (localStorage.getItem("token")) {
    document.addEventListener("click", resetInactivityTimer);
    document.addEventListener("keypress", resetInactivityTimer);
    document.addEventListener("mousemove", resetInactivityTimer);
    resetInactivityTimer();
}
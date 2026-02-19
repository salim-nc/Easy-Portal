// ==============================
// Requête API générique
// ==============================
async function apiRequest(endpoint, method = "GET", body = null, auth = false) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = "Bearer " + token;
        }
    }

    const options = {
        method,
        headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);

        // Lire le corps de la réponse même en cas d'erreur pour avoir le message
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message = (data && (data.message || data.error)) || "Erreur API (" + response.status + ")";
            console.error("API Error:", response.status, message);
            throw new Error(message);
        }

        return data;
    } catch (err) {
        // Si c'est une erreur réseau (CORS, serveur down, etc.)
        if (err.name === "TypeError" && err.message === "Failed to fetch") {
            console.error("Impossible de joindre l'API. Vérifiez que le serveur est en ligne et que CORS est activé.");
            throw new Error("Impossible de joindre le serveur API.");
        }
        throw err;
    }
}

// ==============================
// DOM READY
// ==============================
document.addEventListener("DOMContentLoaded", () => {

    // Gestion déconnexion
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            window.location.replace("index.html");
        });
    }

    // Tracking automatique des boutons
    const token = localStorage.getItem("token");
    if (token) {
        document.querySelectorAll("button[data-track]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const actionName = btn.getAttribute("data-track") || btn.innerText || "action_inconnue";
                try {
                    await apiRequest("/activity", "POST", { action: actionName }, true);
                } catch {
                    // Silencieux
                }
            });
        });
    }
});

// ==============================
// Vérification du token
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
    } catch {
        localStorage.removeItem("token");
        window.location.replace("login.html");
        return false;
    }
}

// ==============================
// Ouverture portail
// ==============================
async function openPortal() {
    try {
        await apiRequest("/portal/open", "POST", null, true);
       
    } catch (err) {
        alert("Erreur : " + err.message);
    }
}

// ==============================
// Chargement logs
// ==============================
async function loadLogs() {
    try {
        const data = await apiRequest("/logs", "GET", null, true);

        const tableBody = document.querySelector("#logsTable tbody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (Array.isArray(data)) {
            data.forEach(log => {
                const tr = document.createElement("tr");
                tr.innerHTML =
                    "<td>" + (log.date || "") + "</td>" +
                    "<td>" + (log.user || "") + "</td>" +
                    "<td>" + (log.action || "") + "</td>";
                tableBody.appendChild(tr);
            });
        } else if (data.data && Array.isArray(data.data)) {
            data.data.forEach(log => {
                const tr = document.createElement("tr");
                tr.innerHTML =
                    "<td>" + (log.date || "") + "</td>" +
                    "<td>" + (log.user || "") + "</td>" +
                    "<td>" + (log.action || "") + "</td>";
                tableBody.appendChild(tr);
            });
        }

    } catch (err) {
        console.error("Erreur chargement logs:", err);
        alert("Impossible de charger les logs.");
    }
}
// ==============================
// GESTION DES LOGS AMÉLIORÉE
// ==============================

let allLogs = [];

async function initLogs() {
    await loadLogs();
}

async function loadLogs() {
    try {
        const data = await apiRequest("/logs", "GET", null, true);
        allLogs = Array.isArray(data) ? data : (data.data || []);
        
        renderLogs(allLogs);
        updateStats();

    } catch (err) {
        console.error("Erreur chargement logs:", err);
        showMessage("Impossible de charger les logs.", "error");
    }
}

function renderLogs(logs) {
    const tbody = document.getElementById("logsBody");
    const emptyState = document.getElementById("emptyState");

    if (!logs || logs.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        document.getElementById("totalLogs").innerText = "0";
        return;
    }

    emptyState.style.display = "none";
    tbody.innerHTML = "";

    logs.forEach(log => {
        const tr = document.createElement("tr");
        
        // Traiter la date/heure
        let date = "";
        let time = "";
        
        if (log.date) {
            // Si c'est un timestamp ou datetime
            if (log.date.includes(" ")) {
                const parts = log.date.split(" ");
                date = parts[0];
                time = parts[1] || "";
            } else {
                date = log.date;
                time = log.time || "";
            }
        }

        tr.innerHTML = `
            <td>${date || "-"}</td>
            <td>${time || "-"}</td>
            <td>${log.user || log.username || "-"}</td>
            <td>${log.action || "-"}</td>
            <td>${log.plaque || "-"}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("totalLogs").innerText = logs.length;
}

function updateStats() {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const logsToday = allLogs.filter(log => log.date && log.date.includes(today)).length;
    const logsWeek = allLogs.filter(log => {
        const logDate = log.date ? log.date.split(" ")[0] : "";
        return logDate >= weekAgo;
    }).length;

    document.getElementById("logsToday").innerText = logsToday;
    document.getElementById("logsWeek").innerText = logsWeek;
}

// ==============================
// FILTRES
// ==============================

function applyFilters() {
    const filterUser = document.getElementById("filterUser").value.toLowerCase();
    const filterAction = document.getElementById("filterAction").value.toLowerCase();
    const filterDate = document.getElementById("filterDate").value;

    let filtered = allLogs.filter(log => {
        const user = (log.user || log.username || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        const logDate = log.date ? log.date.split(" ")[0] : "";

        const matchUser = !filterUser || user.includes(filterUser);
        const matchAction = !filterAction || action.includes(filterAction);
        const matchDate = !filterDate || logDate === filterDate;

        return matchUser && matchAction && matchDate;
    });

    renderLogs(filtered);
}

// ==============================
// EXPORT CSV
// ==============================

async function exportLogs() {
    if (allLogs.length === 0) {
        showMessage("Aucun log à exporter.", "info");
        return;
    }

    try {
        // Créer le CSV
        let csv = "Date;Heure;Utilisateur;Action;Plaque\n";
        
        allLogs.forEach(log => {
            const date = log.date ? log.date.split(" ")[0] : "";
            const time = log.date && log.date.includes(" ") ? log.date.split(" ")[1] : (log.time || "");
            const user = log.user || log.username || "";
            const action = log.action || "";
            const plaque = log.plaque || "";

            csv += `${date};${time};${user};${action};${plaque}\n`;
        });

        downloadCSV(csv, "logs_easyportal.csv");
        showMessage("✓ Export réussi !", "success");

    } catch (err) {
        showMessage("Erreur lors de l'export : " + err.message, "error");
        console.error("Erreur export:", err);
    }
}

// ==============================
// SUPPRIMER TOUS LES LOGS
// ==============================

async function clearLogs() {
    if (!confirm("⚠️ ATTENTION : Supprimer TOUS les logs ?")) return;
    if (!confirm("Êtes-vous vraiment sûr ? Cette action est irréversible !")) return;

    try {
        await apiRequest("/logs/clear-all", "POST", null, true);
        showMessage("✓ Tous les logs ont été supprimés !", "success");
        await loadLogs();

    } catch (err) {
        showMessage("Erreur : " + err.message, "error");
    }
}

// ==============================
// UTILITAIRES
// ==============================

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showMessage(message, type) {
    const el = document.getElementById("messageContainer");
    el.innerText = message;
    el.className = `message ${type}`;

    setTimeout(() => {
        el.className = "message";
    }, 5000);
}

// Fonction de déconnexion (à ajouter si elle n'existe pas)
function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}
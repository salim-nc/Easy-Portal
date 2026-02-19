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
        
        console.log("===== DEBUG LOGS =====");
        console.log("1. data:", data);
        console.log("2. typeof data:", typeof data);
        console.log("3. data.data:", data ? data.data : "undefined");
        console.log("4. data.data.logs:", data && data.data ? data.data.logs : "undefined");
        console.log("5. Array.isArray(data.data.logs)?", data && data.data ? Array.isArray(data.data.logs) : false);
        console.log("====================");
        
        // Vérifier chaque condition
        if (data && data.data && data.data.logs && Array.isArray(data.data.logs)) {
            console.log("✓ Condition 1 OK: data.data.logs");
            allLogs = data.data.logs;
        } else if (Array.isArray(data)) {
            console.log("✓ Condition 2 OK: data is array");
            allLogs = data;
        } else if (data.logs && Array.isArray(data.logs)) {
            console.log("✓ Condition 3 OK: data.logs");
            allLogs = data.logs;
        } else {
            console.error("❌ AUCUNE CONDITION VALIDE");
            console.error("data est:", data);
            allLogs = [];
        }
        
        console.log("Final allLogs:", allLogs);
        console.log("Est array?", Array.isArray(allLogs));
        
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

    if (!logs || !Array.isArray(logs) || logs.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        if (document.getElementById("totalLogs")) {
            document.getElementById("totalLogs").innerText = "0";
        }
        return;
    }

    emptyState.style.display = "none";
    tbody.innerHTML = "";

    logs.forEach(log => {
        const tr = document.createElement("tr");
        
        // Traiter la date/heure depuis date_heure (ISO format)
        let date = "";
        let time = "";
        
        if (log.date_heure) {
            const dateObj = new Date(log.date_heure);
            date = dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
            time = dateObj.toISOString().split("T")[1].substring(0, 8); // HH:MM:SS
        } else if (log.date) {
            if (log.date.includes(" ")) {
                const parts = log.date.split(" ");
                date = parts[0];
                time = parts[1] || "";
            } else {
                date = log.date;
                time = log.time || "";
            }
        }

        const username = (log.user_nom || "") + " " + (log.user_prenom || "") || log.user_email || "-";
        const plaque = log.plaque_numero || "-";

        tr.innerHTML = `
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${date || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${time || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${username}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${log.action || "-"}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${plaque}</td>
        `;
        tbody.appendChild(tr);
    });

    if (document.getElementById("totalLogs")) {
        document.getElementById("totalLogs").innerText = logs.length;
    }
}

function updateStats() {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const logsToday = allLogs.filter(log => {
        if (!log.date_heure) return false;
        const logDate = new Date(log.date_heure).toISOString().split("T")[0];
        return logDate === today;
    }).length;

    const logsWeek = allLogs.filter(log => {
        if (!log.date_heure) return false;
        const logDate = new Date(log.date_heure).toISOString().split("T")[0];
        return logDate >= weekAgo;
    }).length;

    if (document.getElementById("logsToday")) {
        document.getElementById("logsToday").innerText = logsToday;
    }
    if (document.getElementById("logsWeek")) {
        document.getElementById("logsWeek").innerText = logsWeek;
    }
}

// ==============================
// FILTRES
// ==============================

function applyFilters() {
    const filterUser = document.getElementById("filterUser").value.toLowerCase();
    const filterAction = document.getElementById("filterAction").value.toLowerCase();
    const filterDate = document.getElementById("filterDate").value;

    let filtered = allLogs.filter(log => {
        const user = ((log.user_nom || "") + " " + (log.user_prenom || "")).toLowerCase();
        const action = (log.action || "").toLowerCase();
        
        let logDate = "";
        if (log.date_heure) {
            logDate = new Date(log.date_heure).toISOString().split("T")[0];
        }

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
        let csv = "Date;Heure;Utilisateur;Action;Plaque\n";
        
        allLogs.forEach(log => {
            let date = "";
            let time = "";
            
            if (log.date_heure) {
                const dateObj = new Date(log.date_heure);
                date = dateObj.toISOString().split("T")[0];
                time = dateObj.toISOString().split("T")[1].substring(0, 8);
            }

            const user = (log.user_nom || "") + " " + (log.user_prenom || "");
            const action = log.action || "";
            const plaque = log.plaque_numero || "";

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
    if (!el) return;
    
    el.innerText = message;
    
    if (type === "success") {
        el.style.background = "#d1fae5";
        el.style.color = "#065f46";
        el.style.borderLeft = "4px solid #10b981";
    } else if (type === "error") {
        el.style.background = "#fee2e2";
        el.style.color = "#7f1d1d";
        el.style.borderLeft = "4px solid #ef4444";
    }
    
    el.style.padding = "15px";
    el.style.borderRadius = "8px";
    el.style.marginBottom = "20px";
    el.style.display = "block";

    setTimeout(() => {
        el.style.display = "none";
    }, 5000);
}

function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}
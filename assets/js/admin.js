// ==============================
// GESTION DES PLAQUES AUTORISÉES
// ==============================

async function initAdmin() {
    // Charger les données au démarrage
    await loadAutorisees();
    await loadInterdites();

    // Event listeners pour import
    document.getElementById("importAutorisees").addEventListener("change", handleImportAutorisees);
    document.getElementById("importInterdites").addEventListener("change", handleImportInterdites);

    // Event listeners pour les formulaires
    document.getElementById("formAddAutorisee").addEventListener("submit", handleAddAutorisee);
    document.getElementById("formAddInterdite").addEventListener("submit", handleAddInterdite);

    // Fermer modals en cliquant en dehors
    window.addEventListener("click", function(e) {
        let modal = document.getElementById("modalAddAutorisee");
        if (e.target === modal) closeModal("modalAddAutorisee");
        
        modal = document.getElementById("modalAddInterdite");
        if (e.target === modal) closeModal("modalAddInterdite");
    });
}

// ==============================
// CHARGER LES DONNÉES
// ==============================

async function loadAutorisees() {
    try {
        const data = await apiRequest("/plaques/export-csv", "GET", null, true);
        const plaques = Array.isArray(data) ? data : (data.data || []);
        
        const tbody = document.getElementById("bodyAutorisees");
        tbody.innerHTML = "";

        plaques.forEach((plaque, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${plaque.nom || "-"}</td>
                <td>${plaque.prenom || "-"}</td>
                <td><span class="status-badge status-autorisee">${plaque.plaque1 || "-"}</span></td>
                <td><span class="status-badge status-autorisee">${plaque.plaque2 || "-"}</span></td>
                <td>
                    <button class="delete-btn" onclick="deleteAutorisee(${plaque.id || index})">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById("countAutorisees").innerText = plaques.length;
    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors du chargement des plaques autorisées.", "error");
        console.error("Erreur loadAutorisees:", err);
    }
}

async function loadInterdites() {
    try {
        const data = await apiRequest("/plaques/export-csv-blacklist", "GET", null, true);
        const plaques = Array.isArray(data) ? data : (data.data || []);
        
        const tbody = document.getElementById("bodyInterdites");
        tbody.innerHTML = "";

        plaques.forEach((plaque, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><span class="status-badge status-interdite">${plaque.plaque || "-"}</span></td>
                <td>${plaque.motif || "-"}</td>
                <td>${plaque.date_ajout || "-"}</td>
                <td>
                    <button class="delete-btn" onclick="deleteInterdite(${plaque.id || index})">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById("countInterdites").innerText = plaques.length;
    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors du chargement des plaques interdites.", "error");
        console.error("Erreur loadInterdites:", err);
    }
}

// ==============================
// IMPORT CSV
// ==============================

async function handleImportAutorisees(event) {
    const file = event.target.files[0];
    if (!file) return;

    const progressBar = document.getElementById("progressAutorisees");
    const progressFill = progressBar.querySelector(".progress-fill");
    progressBar.classList.add("active");
    progressFill.style.width = "0%";

    try {
        const text = await file.text();
        const lines = text.trim().split("\n");
        const headers = lines[0].split(";").map(h => h.trim().toLowerCase());

        const plaques = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === "") continue;

            const values = lines[i].split(";").map(v => v.trim());
            const plaque = {};

            headers.forEach((header, idx) => {
                plaque[header] = values[idx] || "";
            });

            if (plaque.nom && plaque.plaque1) {
                plaques.push(plaque);
            }

            progressFill.style.width = ((i / lines.length) * 100) + "%";
        }

        // Envoyer à l'API
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(API_BASE + "/plaques/import-csv", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erreur lors de l'import");
        }

        progressFill.style.width = "100%";
        showMessage("messageAuthAutorisees", `✓ ${plaques.length} plaque(s) importée(s) avec succès !`, "success");
        
        // Réinitialiser l'input
        event.target.value = "";
        
        // Recharger les données
        setTimeout(() => {
            loadAutorisees();
            progressBar.classList.remove("active");
        }, 500);

    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors de l'import : " + err.message, "error");
        console.error("Erreur import:", err);
        document.getElementById("progressAutorisees").classList.remove("active");
    }
}

async function handleImportInterdites(event) {
    const file = event.target.files[0];
    if (!file) return;

    const progressBar = document.getElementById("progressInterdites");
    const progressFill = progressBar.querySelector(".progress-fill");
    progressBar.classList.add("active");
    progressFill.style.width = "0%";

    try {
        const text = await file.text();
        const lines = text.trim().split("\n");
        const headers = lines[0].split(";").map(h => h.trim().toLowerCase());

        const plaques = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === "") continue;

            const values = lines[i].split(";").map(v => v.trim());
            const plaque = {};

            headers.forEach((header, idx) => {
                plaque[header] = values[idx] || "";
            });

            if (plaque.plaque) {
                plaques.push(plaque);
            }

            progressFill.style.width = ((i / lines.length) * 100) + "%";
        }

        // Envoyer à l'API
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(API_BASE + "/plaques/import-csv-blacklist", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erreur lors de l'import");
        }

        progressFill.style.width = "100%";
        showMessage("messageAuthInterdites", `✓ ${plaques.length} plaque(s) interdite(s) importée(s) avec succès !`, "success");
        
        // Réinitialiser l'input
        event.target.value = "";
        
        // Recharger les données
        setTimeout(() => {
            loadInterdites();
            progressBar.classList.remove("active");
        }, 500);

    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors de l'import : " + err.message, "error");
        console.error("Erreur import:", err);
        document.getElementById("progressInterdites").classList.remove("active");
    }
}

// ==============================
// EXPORT CSV
// ==============================

async function exportAutorisees() {
    try {
        const response = await fetch(API_BASE + "/plaques/export-csv", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'export");
        }

        const data = await response.json();
        const plaques = Array.isArray(data) ? data : (data.data || []);

        if (plaques.length === 0) {
            showMessage("messageAuthAutorisees", "Aucune plaque à exporter.", "info");
            return;
        }

        // Créer le CSV
        let csv = "nom;prenom;plaque1;plaque2\n";
        plaques.forEach(plaque => {
            csv += `${plaque.nom};${plaque.prenom || ""};${plaque.plaque1};${plaque.plaque2 || ""}\n`;
        });

        // Télécharger le fichier
        downloadCSV(csv, "plaques_autorisees.csv");
        showMessage("messageAuthAutorisees", "✓ Export réussi !", "success");

    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors de l'export : " + err.message, "error");
        console.error("Erreur export:", err);
    }
}

async function exportInterdites() {
    try {
        const response = await fetch(API_BASE + "/plaques/export-csv-blacklist", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        if (!response.ok) {
            throw new Error("Erreur lors de l'export");
        }

        const data = await response.json();
        const plaques = Array.isArray(data) ? data : (data.data || []);

        if (plaques.length === 0) {
            showMessage("messageAuthInterdites", "Aucune plaque à exporter.", "info");
            return;
        }

        // Créer le CSV
        let csv = "Plaque;Motif;Date_ajout\n";
        plaques.forEach(plaque => {
            csv += `${plaque.plaque};${plaque.motif || ""};${plaque.date_ajout || ""}\n`;
        });

        // Télécharger le fichier
        downloadCSV(csv, "plaques_interdites.csv");
        showMessage("messageAuthInterdites", "✓ Export réussi !", "success");

    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors de l'export : " + err.message, "error");
        console.error("Erreur export:", err);
    }
}

// ==============================
// AJOUTER VIA FORMULAIRE
// ==============================

async function handleAddAutorisee(e) {
    e.preventDefault();

    const nom = document.getElementById("nomAutorisee").value.trim();
    const prenom = document.getElementById("prenomAutorisee").value.trim();
    const plaque1 = document.getElementById("plaque1Autorisee").value.trim();
    const plaque2 = document.getElementById("plaque2Autorisee").value.trim();

    if (!nom || !prenom || !plaque1) {
        showMessage("messageAuthAutorisees", "Veuillez remplir les champs obligatoires.", "error");
        return;
    }

    try {
        await apiRequest("/plaques/autorisees", "POST", {
            nom, prenom, plaque1, plaque2
        }, true);

        showMessage("messageAuthAutorisees", "✓ Plaque ajoutée avec succès !", "success");
        closeModal("modalAddAutorisee");
        document.getElementById("formAddAutorisee").reset();
        await loadAutorisees();

    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur : " + err.message, "error");
    }
}

async function handleAddInterdite(e) {
    e.preventDefault();

    const plaque = document.getElementById("plaqueInterdite").value.trim();
    const motif = document.getElementById("motifInterdite").value.trim();
    const dateAjout = document.getElementById("dateInterdite").value;

    if (!plaque || !motif || !dateAjout) {
        showMessage("messageAuthInterdites", "Veuillez remplir tous les champs.", "error");
        return;
    }

    try {
        await apiRequest("/plaques/interdites", "POST", {
            plaque,
            motif,
            date_ajout: new Date(dateAjout).toLocaleDateString()
        }, true);

        showMessage("messageAuthInterdites", "✓ Plaque interdite ajoutée !", "success");
        closeModal("modalAddInterdite");
        document.getElementById("formAddInterdite").reset();
        await loadInterdites();

    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur : " + err.message, "error");
    }
}

// ==============================
// SUPPRIMER
// ==============================

async function deleteAutorisee(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette plaque ?")) return;

    try {
        await apiRequest(`/plaques/autorisees/${id}`, "DELETE", null, true);
        showMessage("messageAuthAutorisees", "✓ Plaque supprimée !", "success");
        await loadAutorisees();
    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur : " + err.message, "error");
    }
}

async function deleteInterdite(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette plaque ?")) return;

    try {
        await apiRequest(`/plaques/interdites/${id}`, "DELETE", null, true);
        showMessage("messageAuthInterdites", "✓ Plaque supprimée !", "success");
        await loadInterdites();
    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur : " + err.message, "error");
    }
}

async function clearAllAutorisees() {
    if (!confirm("⚠️ ATTENTION : Supprimer TOUTES les plaques autorisées ?")) return;
    if (!confirm("Êtes-vous vraiment sûr ? Cette action est irréversible !")) return;

    try {
        await apiRequest("/plaques/autorisees/clear-all", "POST", null, true);
        showMessage("messageAuthAutorisees", "✓ Toutes les plaques ont été supprimées !", "success");
        await loadAutorisees();
    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur : " + err.message, "error");
    }
}

async function clearAllInterdites() {
    if (!confirm("⚠️ ATTENTION : Supprimer TOUTES les plaques interdites ?")) return;
    if (!confirm("Êtes-vous vraiment sûr ? Cette action est irréversible !")) return;

    try {
        await apiRequest("/plaques/interdites/clear-all", "POST", null, true);
        showMessage("messageAuthInterdites", "✓ Toutes les plaques ont été supprimées !", "success");
        await loadInterdites();
    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur : " + err.message, "error");
    }
}

// ==============================
// MODALS
// ==============================

function openAddAutoriseModal() {
    document.getElementById("modalAddAutorisee").classList.add("active");
    document.getElementById("nomAutorisee").focus();
}

function openAddInterditeModal() {
    document.getElementById("modalAddInterdite").classList.add("active");
    document.getElementById("plaqueInterdite").focus();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
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

function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.innerText = message;
    el.className = `message ${type}`;

    // Auto-hide après 5 secondes
    setTimeout(() => {
        el.className = "message";
    }, 5000);
}
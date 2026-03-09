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
// SÉCURITÉ - Validation des plaques d'immatriculation
// ==============================
function isValidPlate(plate) {
    if (!plate) return false;
    // Format: AA-123-BB ou variations
    const plateRegex = /^[A-Z0-9\-]{2,10}$/i;
    return plateRegex.test(plate) && plate.length <= 20;
}

// ==============================
// SÉCURITÉ - Validation des noms
// ==============================
function isValidName(name) {
    if (!name) return false;
    // Pas de caractères spéciaux dangereux
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,100}$/;
    return nameRegex.test(name);
}

// ==============================
// INITIALISATION SÉCURISÉE
// ==============================
async function initAdmin() {
    // Vérifier l'authentification d'abord
    if (!localStorage.getItem("token")) {
        window.location.replace("login.html");
        return;
    }

    // Charger les données au démarrage
    await loadAutorisees();
    await loadInterdites();

    // ==============================
    // SÉCURITÉ - Event listeners sécurisés
    // ==============================
    const importAutorisees = document.getElementById("importAutorisees");
    const importInterdites = document.getElementById("importInterdites");
    const formAddAutorisee = document.getElementById("formAddAutorisee");
    const formAddInterdite = document.getElementById("formAddInterdite");

    if (importAutorisees) importAutorisees.addEventListener("change", handleImportAutorisees);
    if (importInterdites) importInterdites.addEventListener("change", handleImportInterdites);
    if (formAddAutorisee) formAddAutorisee.addEventListener("submit", handleAddAutorisee);
    if (formAddInterdite) formAddInterdite.addEventListener("submit", handleAddInterdite);

    // Fermer modals en cliquant en dehors
    window.addEventListener("click", function(e) {
        const modalAutorisee = document.getElementById("modalAddAutorisee");
        const modalInterdite = document.getElementById("modalAddInterdite");

        if (e.target === modalAutorisee) closeModal("modalAddAutorisee");
        if (e.target === modalInterdite) closeModal("modalAddInterdite");
    });
}

// ==============================
// CHARGER LES PLAQUES AUTORISÉES
// ==============================
async function loadAutorisees() {
    try {
        const data = await apiRequest("/plaques/export-csv", "GET", null, true);
        const plaques = Array.isArray(data) ? data : (data.data || []);
        
        const tbody = document.getElementById("bodyAutorisees");
        if (!tbody) return;

        tbody.innerHTML = "";

        plaques.forEach((plaque, index) => {
            const tr = document.createElement("tr");
            // ==============================
            // SÉCURITÉ - Sanitizer les données avant insertion
            // ==============================
            tr.innerHTML = `
                <td>${sanitizeHTML(plaque.nom || "-")}</td>
                <td>${sanitizeHTML(plaque.prenom || "-")}</td>
                <td><span class="status-badge status-autorisee">${sanitizeHTML(plaque.plaque1 || "-")}</span></td>
                <td><span class="status-badge status-autorisee">${sanitizeHTML(plaque.plaque2 || "-")}</span></td>
                <td>
                    <button class="delete-btn" onclick="deleteAutorisee(${sanitizeHTML(plaque.id || index)})">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const countEl = document.getElementById("countAutorisees");
        if (countEl) countEl.innerText = plaques.length;
    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors du chargement des plaques autorisées.", "error");
        console.error("Erreur loadAutorisees:", err);
    }
}

// ==============================
// CHARGER LES PLAQUES INTERDITES
// ==============================
async function loadInterdites() {
    try {
        const data = await apiRequest("/plaques/export-csv-blacklist", "GET", null, true);
        const plaques = Array.isArray(data) ? data : (data.data || []);
        
        const tbody = document.getElementById("bodyInterdites");
        if (!tbody) return;

        tbody.innerHTML = "";

        plaques.forEach((plaque, index) => {
            const tr = document.createElement("tr");
            // ==============================
            // SÉCURITÉ - Sanitizer les données
            // ==============================
            tr.innerHTML = `
                <td><span class="status-badge status-interdite">${sanitizeHTML(plaque.plaque || "-")}</span></td>
                <td>${sanitizeHTML(plaque.motif || "-")}</td>
                <td>${sanitizeHTML(plaque.date_ajout || "-")}</td>
                <td>
                    <button class="delete-btn" onclick="deleteInterdite(${sanitizeHTML(plaque.id || index)})">Supprimer</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const countEl = document.getElementById("countInterdites");
        if (countEl) countEl.innerText = plaques.length;
    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors du chargement des plaques interdites.", "error");
        console.error("Erreur loadInterdites:", err);
    }
}

// ==============================
// IMPORT CSV AUTORISÉES SÉCURISÉ
// ==============================
async function handleImportAutorisees(event) {
    const file = event.target.files[0];
    if (!file) return;

    // ==============================
    // SÉCURITÉ - Vérifier le type de fichier
    // ==============================
    if (!file.type.includes("text") && file.type !== "application/vnd.ms-excel") {
        showMessage("messageAuthAutorisees", "Le fichier doit être un CSV.", "error");
        return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage("messageAuthAutorisees", "Le fichier est trop volumineux (max 5MB).", "error");
        return;
    }

    const progressBar = document.getElementById("progressAutorisees");
    const progressFill = progressBar?.querySelector(".progress-fill");
    if (progressBar) progressBar.classList.add("active");
    if (progressFill) progressFill.style.width = "0%";

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

            // ==============================
            // SÉCURITÉ - Valider les données avant envoi
            // ==============================
            if (isValidName(plaque.nom) && isValidPlate(plaque.plaque1)) {
                plaques.push(plaque);
            }

            if (progressFill) progressFill.style.width = ((i / lines.length) * 100) + "%";
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

        if (progressFill) progressFill.style.width = "100%";
        showMessage("messageAuthAutorisees", `✓ ${plaques.length} plaque(s) importée(s) avec succès !`, "success");
        
        event.target.value = "";
        
        setTimeout(() => {
            loadAutorisees();
            if (progressBar) progressBar.classList.remove("active");
        }, 500);

    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors de l'import : " + sanitizeHTML(err.message), "error");
        console.error("Erreur import:", err);
        if (progressBar) progressBar.classList.remove("active");
    }
}

// ==============================
// IMPORT CSV INTERDITES SÉCURISÉ
// ==============================
async function handleImportInterdites(event) {
    const file = event.target.files[0];
    if (!file) return;

    // ==============================
    // SÉCURITÉ - Vérifier le type et la taille
    // ==============================
    if (!file.type.includes("text") && file.type !== "application/vnd.ms-excel") {
        showMessage("messageAuthInterdites", "Le fichier doit être un CSV.", "error");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showMessage("messageAuthInterdites", "Le fichier est trop volumineux (max 5MB).", "error");
        return;
    }

    const progressBar = document.getElementById("progressInterdites");
    const progressFill = progressBar?.querySelector(".progress-fill");
    if (progressBar) progressBar.classList.add("active");
    if (progressFill) progressFill.style.width = "0%";

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

            // ==============================
            // SÉCURITÉ - Valider la plaque
            // ==============================
            if (isValidPlate(plaque.plaque)) {
                plaques.push(plaque);
            }

            if (progressFill) progressFill.style.width = ((i / lines.length) * 100) + "%";
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

        if (progressFill) progressFill.style.width = "100%";
        showMessage("messageAuthInterdites", `✓ ${plaques.length} plaque(s) interdite(s) importée(s) !`, "success");
        
        event.target.value = "";
        
        setTimeout(() => {
            loadInterdites();
            if (progressBar) progressBar.classList.remove("active");
        }, 500);

    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors de l'import : " + sanitizeHTML(err.message), "error");
        console.error("Erreur import:", err);
        if (progressBar) progressBar.classList.remove("active");
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

        let csv = "nom;prenom;plaque1;plaque2\n";
        plaques.forEach(plaque => {
            csv += `${sanitizeHTML(plaque.nom)};${sanitizeHTML(plaque.prenom || "")};${sanitizeHTML(plaque.plaque1)};${sanitizeHTML(plaque.plaque2 || "")}\n`;
        });

        downloadCSV(csv, "plaques_autorisees.csv");
        showMessage("messageAuthAutorisees", "✓ Export réussi !", "success");

    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur lors de l'export : " + sanitizeHTML(err.message), "error");
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

        let csv = "Plaque;Motif;Date_ajout\n";
        plaques.forEach(plaque => {
            csv += `${sanitizeHTML(plaque.plaque)};${sanitizeHTML(plaque.motif || "")};${sanitizeHTML(plaque.date_ajout || "")}\n`;
        });

        downloadCSV(csv, "plaques_interdites.csv");
        showMessage("messageAuthInterdites", "✓ Export réussi !", "success");

    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur lors de l'export : " + sanitizeHTML(err.message), "error");
        console.error("Erreur export:", err);
    }
}

// ==============================
// AJOUTER PLAQUE AUTORISÉE - SÉCURISÉ
// ==============================
async function handleAddAutorisee(e) {
    e.preventDefault();

    const nom = document.getElementById("nomAutorisee").value.trim();
    const prenom = document.getElementById("prenomAutorisee").value.trim();
    const plaque1 = document.getElementById("plaque1Autorisee").value.trim();
    const plaque2 = document.getElementById("plaque2Autorisee").value.trim();

    // ==============================
    // SÉCURITÉ - Validation stricte
    // ==============================
    if (!isValidName(nom) || !isValidName(prenom) || !isValidPlate(plaque1)) {
        showMessage("messageAuthAutorisees", "Données invalides. Vérifiez les champs.", "error");
        return;
    }

    if (plaque2 && !isValidPlate(plaque2)) {
        showMessage("messageAuthAutorisees", "La plaque 2 est invalide.", "error");
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
        showMessage("messageAuthAutorisees", "Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// AJOUTER PLAQUE INTERDITE - SÉCURISÉ
// ==============================
async function handleAddInterdite(e) {
    e.preventDefault();

    const plaque = document.getElementById("plaqueInterdite").value.trim();
    const motif = document.getElementById("motifInterdite").value.trim();
    const dateAjout = document.getElementById("dateInterdite").value;

    // ==============================
    // SÉCURITÉ - Validation stricte
    // ==============================
    if (!isValidPlate(plaque) || !motif || motif.length < 3 || motif.length > 200 || !dateAjout) {
        showMessage("messageAuthInterdites", "Veuillez remplir tous les champs correctement.", "error");
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
        showMessage("messageAuthInterdites", "Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// SUPPRIMER PLAQUES
// ==============================
async function deleteAutorisee(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette plaque ?")) return;

    try {
        await apiRequest(`/plaques/autorisees/${id}`, "DELETE", null, true);
        showMessage("messageAuthAutorisees", "✓ Plaque supprimée !", "success");
        await loadAutorisees();
    } catch (err) {
        showMessage("messageAuthAutorisees", "Erreur : " + sanitizeHTML(err.message), "error");
    }
}

async function deleteInterdite(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette plaque ?")) return;

    try {
        await apiRequest(`/plaques/interdites/${id}`, "DELETE", null, true);
        showMessage("messageAuthInterdites", "✓ Plaque supprimée !", "success");
        await loadInterdites();
    } catch (err) {
        showMessage("messageAuthInterdites", "Erreur : " + sanitizeHTML(err.message), "error");
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
        showMessage("messageAuthAutorisees", "Erreur : " + sanitizeHTML(err.message), "error");
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
        showMessage("messageAuthInterdites", "Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// MODALS
// ==============================
function openAddAutoriseModal() {
    const modal = document.getElementById("modalAddAutorisee");
    if (modal) {
        modal.classList.add("active");
        const nomInput = document.getElementById("nomAutorisee");
        if (nomInput) nomInput.focus();
    }
}

function openAddInterditeModal() {
    const modal = document.getElementById("modalAddInterdite");
    if (modal) {
        modal.classList.add("active");
        const plaqueInput = document.getElementById("plaqueInterdite");
        if (plaqueInput) plaqueInput.focus();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
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

// ==============================
// AFFICHAGE DES MESSAGES - SANS DISPARITION
// ==============================
function showMessage(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = "block";
    
    // Les messages restent affichés indéfiniment
    // L'utilisateur doit les fermer manuellement ou recharger la page
}
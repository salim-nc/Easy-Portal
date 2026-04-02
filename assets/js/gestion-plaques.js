// ==============================
// VALIDATION PLAQUE
// ==============================
function isValidPlate(plate) {
    if (!plate) return false;
    const plateRegex = /^[A-Z0-9\-]{2,10}$/i;
    return plateRegex.test(plate) && plate.length <= 20;
}

// ==============================
// VARIABLES GLOBALES
// ==============================
let allUsers = [];
let allPlaques = [];

// ==============================
// INITIALISATION
// ==============================
async function initGestionPlaques() {
    if (!localStorage.getItem("token")) {
        window.location.replace("login.html");
        return;
    }

    await loadUsers();
    await loadPlaques();

    // Event listeners formulaires
    const formAdd = document.getElementById("formAddPlaque");
    const formEdit = document.getElementById("formEditPlaque");

    if (formAdd) formAdd.addEventListener("submit", handleAddPlaque);
    if (formEdit) formEdit.addEventListener("submit", handleEditPlaque);

    // Fermer modals en cliquant en dehors
    window.addEventListener("click", function(e) {
        if (e.target.classList.contains("modal-overlay")) {
            e.target.classList.remove("active");
        }
    });
}

// ==============================
// CHARGER LES UTILISATEURS + REMPLIR LES MENUS DEROULANTS
// ==============================
async function loadUsers() {
    try {
        const data = await apiRequest("/users", "GET", null, true);
        allUsers = Array.isArray(data) ? data : (data.data || []);
        populateUserSelect("addUtilisateurId");
        populateUserSelect("editUtilisateurId");
    } catch (err) {
        console.error("Erreur chargement utilisateurs:", err);
        allUsers = [];
    }
}

// ==============================
// REMPLIR UN MENU DEROULANT AVEC LES UTILISATEURS
// ==============================
function populateUserSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Garder la première option par défaut
    select.innerHTML = '<option value="">— Aucun utilisateur —</option>';

    allUsers.forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.prenom + " " + user.nom + " (" + user.email + ")";
        select.appendChild(option);
    });
}

// ==============================
// CHARGER LES PLAQUES
// ==============================
async function loadPlaques() {
    try {
        const data = await apiRequest("/plaques", "GET", null, true);
        allPlaques = Array.isArray(data) ? data : (data.data || []);

        const tbody = document.getElementById("plaquesBody");
        const emptyState = document.getElementById("emptyStatePlaques");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (allPlaques.length === 0) {
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";

        allPlaques.forEach(plaque => {
            const tr = document.createElement("tr");

            const statutClass = plaque.statut === "AUTORISEE" ? "badge-autorisee" : "badge-interdite";
            const statutText = plaque.statut === "AUTORISEE" ? "Autorisée" : "Interdite";

            const proprietaire = (plaque.nom && plaque.prenom)
                ? sanitizeHTML(plaque.prenom) + " " + sanitizeHTML(plaque.nom)
                : '<span class="badge badge-none">Non attribué</span>';

            const capteur = plaque.capteur_id
                ? '<span class="badge badge-capteur">' + sanitizeHTML(plaque.capteur_id) + '</span>'
                : '<span class="badge badge-none">Aucun</span>';

            tr.innerHTML =
                '<td><strong>' + sanitizeHTML(plaque.numero_plaque) + '</strong></td>' +
                '<td><span class="badge ' + statutClass + '">' + statutText + '</span></td>' +
                '<td>' + proprietaire + '</td>' +
                '<td>' + capteur + '</td>' +
                '<td>' +
                    '<button class="btn-edit" onclick="openEditPlaqueModal(' + plaque.id + ')" style="margin-right: 5px;">Modifier</button>' +
                    '<button class="btn-danger" onclick="deletePlaque(' + plaque.id + ')">Supprimer</button>' +
                '</td>';

            tbody.appendChild(tr);
        });
    } catch (err) {
        showMessagePlaques("Erreur lors du chargement des plaques.", "error");
        console.error("Erreur loadPlaques:", err);
    }
}

// ==============================
// AJOUTER UNE PLAQUE
// ==============================
async function handleAddPlaque(e) {
    e.preventDefault();

    const numero = document.getElementById("addNumeroPlaque").value.trim().toUpperCase();
    const utilisateurs_id = document.getElementById("addUtilisateurId").value;
    const capteur_id = document.getElementById("addCapteurId").value.trim();
    const statut = document.getElementById("addStatut").value;

    if (!numero) {
        showMessagePlaques("Veuillez entrer un numéro de plaque.", "error");
        return;
    }

    if (!isValidPlate(numero)) {
        showMessagePlaques("Format de plaque invalide.", "error");
        return;
    }

    try {
        const body = { numero: numero };

        if (utilisateurs_id) body.utilisateurs_id = parseInt(utilisateurs_id);
        if (capteur_id) body.capteur_id = capteur_id;

        // Ajouter la plaque
        const result = await apiRequest("/plaques", "POST", body, true);

        // Si statut INTERDITE, mettre à jour le statut
        if (statut === "INTERDITE" && result && result.data && result.data.id) {
            await apiRequest("/plaques/" + result.data.id, "PUT", { statut: "INTERDITE" }, true);
        }

        showMessagePlaques("Plaque " + sanitizeHTML(numero) + " ajoutée avec succès !", "success");
        closeModal("modalAddPlaque");
        document.getElementById("formAddPlaque").reset();
        await loadPlaques();

    } catch (err) {
        showMessagePlaques("Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// OUVRIR LE MODAL DE MODIFICATION
// ==============================
function openEditPlaqueModal(plaqueId) {
    const plaque = allPlaques.find(p => p.id === plaqueId);
    if (!plaque) return;

    document.getElementById("editPlaqueId").value = plaque.id;
    document.getElementById("editNumeroPlaque").value = plaque.numero_plaque || "";
    document.getElementById("editCapteurId").value = plaque.capteur_id || "";
    document.getElementById("editStatut").value = plaque.statut || "AUTORISEE";

    // Sélectionner l'utilisateur actuel dans le menu déroulant
    const selectEdit = document.getElementById("editUtilisateurId");
    if (plaque.utilisateurs_id) {
        selectEdit.value = plaque.utilisateurs_id;
    } else {
        selectEdit.value = "";
    }

    const modal = document.getElementById("modalEditPlaque");
    if (modal) modal.classList.add("active");
}

// ==============================
// MODIFIER UNE PLAQUE
// ==============================
async function handleEditPlaque(e) {
    e.preventDefault();

    const id = document.getElementById("editPlaqueId").value;
    const numero = document.getElementById("editNumeroPlaque").value.trim().toUpperCase();
    const utilisateurs_id = document.getElementById("editUtilisateurId").value;
    const capteur_id = document.getElementById("editCapteurId").value.trim();
    const statut = document.getElementById("editStatut").value;

    if (!numero) {
        showMessagePlaques("Veuillez entrer un numéro de plaque.", "error");
        return;
    }

    try {
        const body = {
            numero: numero,
            statut: statut,
            capteur_id: capteur_id || null,
            utilisateurs_id: utilisateurs_id ? parseInt(utilisateurs_id) : null
        };

        await apiRequest("/plaques/" + id, "PUT", body, true);

        showMessagePlaques("Plaque " + sanitizeHTML(numero) + " modifiée avec succès !", "success");
        closeModal("modalEditPlaque");
        await loadPlaques();

    } catch (err) {
        showMessagePlaques("Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// SUPPRIMER UNE PLAQUE
// ==============================
async function deletePlaque(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette plaque ?")) return;

    try {
        await apiRequest("/plaques/" + id, "DELETE", null, true);
        showMessagePlaques("Plaque supprimée avec succès !", "success");
        await loadPlaques();
    } catch (err) {
        showMessagePlaques("Erreur : " + sanitizeHTML(err.message), "error");
    }
}

// ==============================
// MODALS
// ==============================
function openAddPlaqueModal() {
    document.getElementById("formAddPlaque").reset();

    const modal = document.getElementById("modalAddPlaque");
    if (modal) {
        modal.classList.add("active");
        setTimeout(function() {
            document.getElementById("addNumeroPlaque").focus();
        }, 100);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
}

// ==============================
// MESSAGE
// ==============================
function showMessagePlaques(message, type) {
    const el = document.getElementById("messageGestionPlaques");
    if (!el) return;

    el.textContent = message;
    el.className = "message " + type;
    el.style.display = "block";

    setTimeout(function() {
        el.style.display = "none";
        el.className = "message";
    }, 5000);
}
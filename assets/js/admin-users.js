// ==============================
// GESTION DES UTILISATEURS
// ==============================

let allUsersAdmin = [];

async function initUsers() {
    await loadUsers();
    
    // Event listeners pour les formulaires
    document.getElementById("formAddUser").addEventListener("submit", handleAddUser);
    document.getElementById("formEditUser").addEventListener("submit", handleEditUser);

    // Fermer modals en cliquant en dehors
    window.addEventListener("click", function(e) {
        var modal = document.getElementById("modalAddUser");
        if (e.target === modal) closeModal("modalAddUser");
        
        modal = document.getElementById("modalEditUser");
        if (e.target === modal) closeModal("modalEditUser");
    });
}

// ==============================
// CHARGER LES UTILISATEURS
// ==============================

async function loadUsers() {
    try {
        var data = await apiRequest("/users", "GET", null, true);
        allUsersAdmin = Array.isArray(data) ? data : (data.data || []);
        renderUsers(allUsersAdmin);
    } catch (err) {
        showMessage("Erreur lors du chargement des utilisateurs.", "error");
        console.error("Erreur loadUsers:", err);
    }
}

function renderUsers(users) {
    var tbody = document.getElementById("usersBody");
    var emptyState = document.getElementById("emptyState");

    if (!users || users.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";
    tbody.innerHTML = "";

    users.forEach(function(user) {
        var tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #e5e7eb";
        
        tr.innerHTML =
            '<td style="padding: 12px;">' + sanitizeHTML(user.email || "-") + '</td>' +
            '<td style="padding: 12px;">' + sanitizeHTML(user.nom || "-") + '</td>' +
            '<td style="padding: 12px;">' + sanitizeHTML(user.prenom || "-") + '</td>' +
            '<td style="padding: 12px;">' +
                '<button style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;" onclick="openEditUserModal(' + user.id + ')">Modifier</button>' +
                '<button style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" onclick="deleteUser(' + user.id + ')">Supprimer</button>' +
            '</td>';

        tbody.appendChild(tr);
    });
}

// ==============================
// AJOUTER UN UTILISATEUR
// ==============================

async function handleAddUser(e) {
    e.preventDefault();

    var email = document.getElementById("emailUser").value.trim();
    var nom = document.getElementById("nomUser").value.trim();
    var prenom = document.getElementById("prenomUser").value.trim();
    var password = document.getElementById("passwordUser").value.trim();

    if (!email || !nom || !prenom || !password) {
        showMessage("Tous les champs sont obligatoires.", "error");
        return;
    }

    // Validation email simple
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("Email invalide.", "error");
        return;
    }

    try {
        await apiRequest("/auth/register", "POST", {
            email: email,
            nom: nom,
            prenom: prenom,
            password: password
        }, true);

        showMessage("Utilisateur ajouté avec succès !", "success");
        closeModal("modalAddUser");
        document.getElementById("formAddUser").reset();
        await loadUsers();

    } catch (err) {
        showMessage("Erreur : " + err.message, "error");
    }
}

// ==============================
// MODIFIER UN UTILISATEUR
// ==============================

async function openEditUserModal(userId) {
    var user = allUsersAdmin.find(function(u) { return u.id === userId; });
    if (!user) return;

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editEmailUser").value = user.email;
    document.getElementById("editNomUser").value = user.nom;
    document.getElementById("editPrenomUser").value = user.prenom;
    document.getElementById("editPasswordUser").value = "";

    openModal("modalEditUser");
}

async function handleEditUser(e) {
    e.preventDefault();

    var userId = document.getElementById("editUserId").value;
    var email = document.getElementById("editEmailUser").value.trim();
    var nom = document.getElementById("editNomUser").value.trim();
    var prenom = document.getElementById("editPrenomUser").value.trim();
    var password = document.getElementById("editPasswordUser").value.trim();

    if (!email || !nom || !prenom) {
        showMessage("Email, nom et prénom sont obligatoires.", "error");
        return;
    }

    try {
        var data = {
            email: email,
            nom: nom,
            prenom: prenom
        };

        // Ajouter le password seulement s'il est rempli
        if (password) {
            data.mot_de_passe = password;
        }

        await apiRequest("/users/" + userId, "PUT", data, true);

        showMessage("Utilisateur modifié avec succès !", "success");
        closeModal("modalEditUser");
        document.getElementById("formEditUser").reset();
        await loadUsers();

    } catch (err) {
        showMessage("Erreur : " + err.message, "error");
    }
}

// ==============================
// SUPPRIMER UN UTILISATEUR
// ==============================

async function deleteUser(userId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
        await apiRequest("/users/" + userId, "DELETE", null, true);
        showMessage("Utilisateur supprimé !", "success");
        await loadUsers();
    } catch (err) {
        console.error("Erreur suppression:", err);
        showMessage("Erreur suppression : " + err.message, "error");
    }
}

// ==============================
// MODALS
// ==============================

function openAddUserModal() {
    document.getElementById("modalAddUser").style.display = "flex";
    document.getElementById("emailUser").focus();
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

// ==============================
// UTILITAIRES
// ==============================

function showMessage(message, type) {
    var el = document.getElementById("messageContainer");
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

    setTimeout(function() {
        el.style.display = "none";
    }, 5000);
}
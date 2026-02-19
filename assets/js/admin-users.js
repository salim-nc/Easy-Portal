// ==============================
// GESTION DES UTILISATEURS
// ==============================

let allUsers = [];

async function initUsers() {
    await loadUsers();
    
    // Event listeners pour les formulaires
    document.getElementById("formAddUser").addEventListener("submit", handleAddUser);
    document.getElementById("formEditUser").addEventListener("submit", handleEditUser);

    // Fermer modals en cliquant en dehors
    window.addEventListener("click", function(e) {
        let modal = document.getElementById("modalAddUser");
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
        const data = await apiRequest("/users", "GET", null, true);
        allUsers = Array.isArray(data) ? data : (data.data || []);
        
        console.log("Utilisateurs chargés:", allUsers); // DEBUG
        renderUsers(allUsers);
    } catch (err) {
        showMessage("Erreur lors du chargement des utilisateurs.", "error");
        console.error("Erreur loadUsers:", err);
    }
}

function renderUsers(users) {
    const tbody = document.getElementById("usersBody");
    const emptyState = document.getElementById("emptyState");

    if (!users || users.length === 0) {
        tbody.innerHTML = "";
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";
    tbody.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid #e5e7eb";
        
        // Badge pour le type d'accès
        let typeBadge = '<span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">TOTAL</span>';
        if (user.type_acces === 'REDUIT') {
            typeBadge = '<span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">RÉDUIT</span>';
        }
        
        tr.innerHTML = `
            <td style="padding: 12px;">${user.email || "-"}</td>
            <td style="padding: 12px;">${user.nom || "-"}</td>
            <td style="padding: 12px;">${user.prenom || "-"}</td>
            <td style="padding: 12px;">${typeBadge}</td>
            <td style="padding: 12px;">
                <button style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 5px;" onclick="openEditUserModal(${user.id})">Modifier</button>
                <button style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" onclick="deleteUser(${user.id})">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ==============================
// AJOUTER UN UTILISATEUR
// ==============================

async function handleAddUser(e) {
    e.preventDefault();

    const email = document.getElementById("emailUser").value.trim();
    const nom = document.getElementById("nomUser").value.trim();
    const prenom = document.getElementById("prenomUser").value.trim();
    const type_acces = document.getElementById("typeAccesUser").value;
    const password = document.getElementById("passwordUser").value.trim();

    if (!email || !nom || !prenom || !password) {
        showMessage("Tous les champs sont obligatoires.", "error");
        return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("Email invalide.", "error");
        return;
    }

    try {
        await apiRequest("/auth/register", "POST", {
            email,
            nom,
            prenom,
            type_acces,
            password
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
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById("editUserId").value = user.id;
    document.getElementById("editEmailUser").value = user.email;
    document.getElementById("editNomUser").value = user.nom;
    document.getElementById("editPrenomUser").value = user.prenom;
    document.getElementById("editTypeAccesUser").value = user.type_acces || 'TOTAL';
    document.getElementById("editPasswordUser").value = "";

    openModal("modalEditUser");
}

async function handleEditUser(e) {
    e.preventDefault();

    const userId = document.getElementById("editUserId").value;
    const email = document.getElementById("editEmailUser").value.trim();
    const nom = document.getElementById("editNomUser").value.trim();
    const prenom = document.getElementById("editPrenomUser").value.trim();
    const type_acces = document.getElementById("editTypeAccesUser").value;
    const password = document.getElementById("editPasswordUser").value.trim();

    if (!email || !nom || !prenom) {
        showMessage("Email, nom et prénom sont obligatoires.", "error");
        return;
    }

    try {
        const data = {
            email,
            nom,
            prenom,
            type_acces
        };

        // Ajouter le password seulement s'il est rempli
        if (password) {
            data.password = password;
        }

        await apiRequest(`/users/${userId}`, "PUT", data, true);

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

// ==============================
// SUPPRIMER UN UTILISATEUR
// ==============================

async function deleteUser(userId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    try {
        console.log("Tentative de suppression de l'utilisateur ID:", userId);
        
        await apiRequest(`/users/${userId}`, "DELETE", null, true);
        
        showMessage("Utilisateur supprimé !", "success");
        await loadUsers();
    } catch (err) {
        console.error("Erreur détaillée suppression:", err);
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
    const el = document.getElementById("messageContainer");
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
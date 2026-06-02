// ==============================
// TRACKING D'ACTIVITÉ
// ==============================

async function trackActivity(action) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await apiRequest("/activity", "POST", { action }, true);
    } catch (err) {
        // Silencieux - pas critique
        console.debug("Activity tracking failed:", err);
    }
}

// Auto-track des actions si connecté
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (token) {
        document.querySelectorAll("button[data-track]").forEach(btn => {
            btn.addEventListener("click", async () => {
                const actionName = btn.getAttribute("data-track") || btn.innerText || "action_inconnue";
                await trackActivity(actionName);
            });
        });
    }
});
package page;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.AuthFailureError;
import com.android.volley.DefaultRetryPolicy; // IMPORTANT POUR LE TEMPS D'ATTENTE
import com.android.volley.Request;
import com.android.volley.toolbox.JsonObjectRequest; // MIEUX QUE STRINGREQUEST
import com.android.volley.toolbox.Volley;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import easyportal.com.R;

public class User1Activity extends AppCompatActivity {

    // --- ADRESSE SERVEUR ---
    // Vérifie toujours que l'IP est la bonne (celle de ton PC/Serveur)
    private static final String URL_OUVERTURE = "http://172.16.15.29:3000/api/portal/open";

    // On garde une référence au bouton pour pouvoir le désactiver/réactiver
    private Button btnOpen;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user1);

        TextView tvWelcome = findViewById(R.id.tvWelcome);
        btnOpen = findViewById(R.id.btnOpenGateUser);
        Button btnLogout = findViewById(R.id.btnLogoutUser);

        // Récupération du prénom
        String prenom = getIntent().getStringExtra("USER_PRENOM");
        if (prenom != null && !prenom.isEmpty()) {
            tvWelcome.setText("Bonjour, " + prenom);
        } else {
            tvWelcome.setText("Bonjour, Utilisateur");
        }

        // Clic sur OUVRIR
        btnOpen.setOnClickListener(v -> ouvrirPortail());

        // Clic sur DÉCONNEXION
        btnLogout.setOnClickListener(v -> {
            SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.clear();
            editor.apply();

            Intent intent = new Intent(User1Activity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            Toast.makeText(User1Activity.this, "Déconnexion réussie", Toast.LENGTH_SHORT).show();
        });
    }

    private void ouvrirPortail() {
        Toast.makeText(this, "Envoi de la commande... Patientez.", Toast.LENGTH_SHORT).show();

        // 1. ON DÉSACTIVE LE BOUTON (pour éviter le spam clic)
        btnOpen.setEnabled(false);
        btnOpen.setText("En cours...");

        // Corps vide {} car c'est du JSON
        JSONObject jsonBody = new JSONObject();

        JsonObjectRequest jsonObjectRequest = new JsonObjectRequest(Request.Method.POST, URL_OUVERTURE, jsonBody,
                response -> {
                    // --- SUCCÈS ---
                    Log.d("PORTAIL", "Réponse OK : " + response.toString());
                    Toast.makeText(User1Activity.this, "Portail ouvert avec succès !", Toast.LENGTH_LONG).show();

                    // On remet le bouton normal
                    btnOpen.setEnabled(true);
                    btnOpen.setText("Ouvrir Portail");
                },
                error -> {
                    // --- ERREUR ---
                    String message = "Erreur inconnue";

                    if (error.networkResponse != null) {
                        message = "Erreur Code : " + error.networkResponse.statusCode;
                        if(error.networkResponse.statusCode == 403 || error.networkResponse.statusCode == 401) {
                            message = "Accès refusé (Token invalide)";
                        }
                    } else {
                        // C'est souvent ici que ça tombe si le serveur est trop lent
                        message = "Le serveur ne répond pas (Timeout)";
                    }

                    Log.e("PORTAIL", "Erreur Volley: " + error.toString());
                    Toast.makeText(User1Activity.this, message, Toast.LENGTH_LONG).show();

                    // On remet le bouton normal même si ça a planté
                    btnOpen.setEnabled(true);
                    btnOpen.setText("Ouvrir Portail");
                }) {

            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();

                // Récupération du token
                SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
                String token = prefs.getString("token", "");

                if (!token.isEmpty()) {
                    headers.put("Authorization", "Bearer " + token);
                }
                headers.put("Content-Type", "application/json");
                return headers;
            }
        };

        // --- 2. AUGMENTATION DU TEMPS D'ATTENTE (TIMEOUT) ---
        // On met 20000ms = 20 secondes d'attente max
        jsonObjectRequest.setRetryPolicy(new DefaultRetryPolicy(
                20000,
                0, // Pas de répétition automatique (0 retries)
                DefaultRetryPolicy.DEFAULT_BACKOFF_MULT));

        Volley.newRequestQueue(this).add(jsonObjectRequest);
    }
}
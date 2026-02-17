package page;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import java.util.HashMap;
import java.util.Map;
import easyportal.com.R;

public class User1Activity extends AppCompatActivity {

    // --- NOUVELLE ADRESSE (Port 3000) ---
    private static final String URL_OUVERTURE = "http://172.16.15.29:3000/api/portal/open";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_user1);

        Button btnOpen = findViewById(R.id.btnOpenGateUser);
        Button btnLogout = findViewById(R.id.btnLogoutUser);

        // Action du bouton OUVRIR
        btnOpen.setOnClickListener(v -> {
            ouvrirPortail();
        });

        // Action du bouton DÉCONNEXION
        btnLogout.setOnClickListener(v -> {
            Intent intent = new Intent(User1Activity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            Toast.makeText(User1Activity.this, "À bientôt !", Toast.LENGTH_SHORT).show();
        });
    }

    private void ouvrirPortail() {
        Toast.makeText(this, "Envoi de la commande...", Toast.LENGTH_SHORT).show();

        StringRequest stringRequest = new StringRequest(Request.Method.POST, URL_OUVERTURE,
                response -> {
                    // Si le serveur répond (200 OK)
                    Toast.makeText(User1Activity.this, "Commande réussie : Portail en mouvement !", Toast.LENGTH_LONG).show();
                },
                error -> {
                    // Si erreur
                    Toast.makeText(User1Activity.this, "Erreur connexion : Vérifie le Wifi et le Port 3000", Toast.LENGTH_LONG).show();
                }) {
            @Override
            protected Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                // Si ton API a besoin d'un token ou d'un ID user, c'est ici qu'on l'ajoute.
                // Pour l'instant, on envoie juste la requête POST vide.
                return params;
            }
        };

        RequestQueue requestQueue = Volley.newRequestQueue(this);
        requestQueue.add(stringRequest);
    }
}
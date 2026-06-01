package page;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import java.util.HashMap;
import java.util.Map;

import easyportal.com.R;

public class AdminActivity extends AppCompatActivity {

    // --- CONFIGURATION ---
    // Assurez-vous que l'IP est joignable depuis le téléphone
    private static final String URL_CAMERA = "http://172.16.15.29:8000";
    private static final String URL_OUVERTURE = "http://172.16.15.29:3000/api/portal/open";

    private WebView webViewCamera;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);

        webViewCamera = findViewById(R.id.webviewCamera);
        Button btnOpenGateAdmin = findViewById(R.id.btnOpenGateAdmin);
        Button btnLogoutAdmin = findViewById(R.id.btnLogoutAdmin);

        setupCamera();

        btnOpenGateAdmin.setOnClickListener(v -> ouvrirPortail());

        btnLogoutAdmin.setOnClickListener(v -> {
            // Suppression du token lors de la déconnexion
            SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();
            editor.clear(); // Ou editor.remove("token");
            editor.apply();

            Intent intent = new Intent(AdminActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            Toast.makeText(AdminActivity.this, "Déconnexion réussie", Toast.LENGTH_SHORT).show();
        });
    }

    private void setupCamera() {
        WebSettings webSettings = webViewCamera.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);

        webViewCamera.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // --- SCRIPT DE NETTOYAGE (Gardé tel quel) ---
                view.loadUrl("javascript:(function() { " +
                        "var imgs = document.getElementsByTagName('img');" +
                        "if (imgs.length > 0) {" +
                        "   var videoSrc = imgs[0].src;" +
                        "   document.body.innerHTML = '';" +
                        "   document.body.style.margin = '0';" +
                        "   document.body.style.padding = '0';" +
                        "   document.body.style.background = 'black';" +
                        "   document.body.style.overflow = 'hidden';" +
                        "   var newImg = document.createElement('img');" +
                        "   newImg.src = videoSrc;" +
                        "   newImg.style.position = 'fixed';" +
                        "   newImg.style.top = '0';" +
                        "   newImg.style.left = '0';" +
                        "   newImg.style.width = '100vw';" +
                        "   newImg.style.height = '100vh';" +
                        "   newImg.style.objectFit = 'cover';" +
                        "   document.body.appendChild(newImg);" +
                        "}" +
                        "})()");
            }
        });
        webViewCamera.loadUrl(URL_CAMERA);
    }

    private void ouvrirPortail() {
        Toast.makeText(this, "Envoi de la commande...", Toast.LENGTH_SHORT).show();

        StringRequest stringRequest = new StringRequest(Request.Method.POST, URL_OUVERTURE,
                response -> {
                    // Succès (Code 200)
                    Toast.makeText(AdminActivity.this, "Portail ouvert avec succès !", Toast.LENGTH_LONG).show();
                },
                error -> {
                    // Erreur
                    String message = "Erreur connexion";
                    if (error.networkResponse != null) {
                        message += " (Code " + error.networkResponse.statusCode + ")";
                    }
                    Toast.makeText(AdminActivity.this, message, Toast.LENGTH_LONG).show();
                    error.printStackTrace();
                }) {

            // --- C'EST ICI QUE LA MAGIE OPÈRE ---
            // On ajoute les Headers pour l'authentification
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();

                // 1. On récupère le token sauvegardé lors du Login
                // (Assurez-vous d'avoir sauvé le token dans "UserPrefs" avec la clé "token" dans LoginActivity)
                SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
                String token = prefs.getString("token", "");

                // 2. On l'ajoute dans le header Authorization
                // Le format standard est "Bearer <votre_token>"
                if (!token.isEmpty()) {
                    headers.put("Authorization", "Bearer " + token);
                }

                // On précise que c'est du JSON (optionnel mais recommandé)
                headers.put("Content-Type", "application/json");

                return headers;
            }
        };

        // Ajout de la requête à la file d'attente
        Volley.newRequestQueue(this).add(stringRequest);
    }
}
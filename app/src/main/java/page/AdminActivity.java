package page;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import easyportal.com.R;

public class AdminActivity extends AppCompatActivity {

    // --- CONFIGURATION ---
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
            Intent intent = new Intent(AdminActivity.this, LoginActivity.class);
            startActivity(intent);
            finish();
            Toast.makeText(AdminActivity.this, "Déconnexion réussie", Toast.LENGTH_SHORT).show();
        });
    }

    private void setupCamera() {
        WebSettings webSettings = webViewCamera.getSettings();
        webSettings.setJavaScriptEnabled(true);

        // On remet les paramètres standards pour que le CSS fonctionne bien
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);

        webViewCamera.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                // --- SCRIPT DE NETTOYAGE TOTAL ---
                view.loadUrl("javascript:(function() { " +
                        // 1. On cherche l'image de la caméra
                        "var imgs = document.getElementsByTagName('img');" +
                        "if (imgs.length > 0) {" +
                        "   var videoSrc = imgs[0].src;" + // On sauvegarde le lien de la vidéo

                        // 2. ON EFFACE TOUT LE CONTENU DE LA PAGE (Texte, cadre vert, marges...)
                        "   document.body.innerHTML = '';" +

                        // 3. On configure le corps de la page pour qu'il n'ait aucune marge
                        "   document.body.style.margin = '0';" +
                        "   document.body.style.padding = '0';" +
                        "   document.body.style.background = 'black';" +
                        "   document.body.style.overflow = 'hidden';" + // Bloque le scroll

                        // 4. On recrée l'image proprement
                        "   var newImg = document.createElement('img');" +
                        "   newImg.src = videoSrc;" +
                        "   newImg.style.position = 'fixed';" +
                        "   newImg.style.top = '0';" +
                        "   newImg.style.left = '0';" +
                        "   newImg.style.width = '100vw';" +  // Prend 100% de la largeur de l'écran
                        "   newImg.style.height = '100vh';" + // Prend 100% de la hauteur de l'écran
                        "   newImg.style.objectFit = 'cover';" + // 'cover' coupe les bords si nécessaire pour remplir, 'fill' étire l'image
                        "   document.body.appendChild(newImg);" +
                        "}" +
                        "})()");
            }
        });

        webViewCamera.loadUrl(URL_CAMERA);
    }

    private void ouvrirPortail() {
        Toast.makeText(this, "Ouverture demandée...", Toast.LENGTH_SHORT).show();

        StringRequest stringRequest = new StringRequest(Request.Method.POST, URL_OUVERTURE,
                response -> Toast.makeText(AdminActivity.this, "Portail ouvert !", Toast.LENGTH_LONG).show(),
                error -> Toast.makeText(AdminActivity.this, "Erreur connexion port 3000", Toast.LENGTH_LONG).show());

        Volley.newRequestQueue(this).add(stringRequest);
    }
}
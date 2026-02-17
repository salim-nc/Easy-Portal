package page; // Garde ton package actuel

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import easyportal.com.R;

public class LoginActivity extends AppCompatActivity {

    private EditText etEmail, etPassword;
    private ImageView btnTogglePassword;
    private Button btnLogin;

    // Nouveaux éléments pour le choix du rôle
    private RadioGroup rgRole;
    private RadioButton rbAdmin;

    private boolean isPasswordVisible = false;

    // --- LES VRAIS LIENS DU SERVEUR ---
    // Si l'IP change, change-la juste ici.
    private static final String URL_LOGIN_ADMIN = "http://172.16.15.29:3000/api/auth/login/admin";
    private static final String URL_LOGIN_USER = "http://172.16.15.29:3000/api/auth/login/user";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // 1. Liaison des vues
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnTogglePassword = findViewById(R.id.btnTogglePassword);
        btnLogin = findViewById(R.id.btnLogin);

        // Liaison des boutons de choix
        rgRole = findViewById(R.id.rgRole);
        rbAdmin = findViewById(R.id.rbAdmin);

        // 2. Gestion de l'oeil (Mot de passe) - INCHANGÉ
        btnTogglePassword.setOnClickListener(v -> {
            if (isPasswordVisible) {
                etPassword.setInputType(android.text.InputType.TYPE_CLASS_TEXT | android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD);
                btnTogglePassword.setAlpha(0.5f);
            } else {
                etPassword.setInputType(android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD);
                btnTogglePassword.setAlpha(1.0f);
            }
            etPassword.setSelection(etPassword.getText().length());
            isPasswordVisible = !isPasswordVisible;
        });

        // 3. Action Connexion
        btnLogin.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();

            if (!email.isEmpty() && !password.isEmpty()) {
                // On vérifie quel bouton est coché (Admin ou User ?)
                if (rbAdmin.isChecked()) {
                    // Si Admin est coché -> On envoie vers l'URL Admin
                    loginRequest(email, password, URL_LOGIN_ADMIN, true);
                } else {
                    // Sinon (User) -> On envoie vers l'URL User
                    loginRequest(email, password, URL_LOGIN_USER, false);
                }
            } else {
                Toast.makeText(LoginActivity.this, "Veuillez remplir tous les champs", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // Fonction unique qui gère la requête vers l'URL qu'on lui donne
    private void loginRequest(final String email, final String password, String urlCible, boolean isAdmin) {
        Toast.makeText(this, "Connexion en cours...", Toast.LENGTH_SHORT).show();

        StringRequest stringRequest = new StringRequest(Request.Method.POST, urlCible,
                response -> {
                    Log.d("API_REPONSE", response); // Affiche la réponse pour débugger

                    try {
                        // On essaie de lire la réponse JSON du serveur
                        JSONObject jsonObject = new JSONObject(response);

                        // Si le serveur répond (même un token), c'est que c'est bon
                        // On vérifie juste qu'on n'a pas une erreur explicite
                        if (!jsonObject.has("error")) {

                            Toast.makeText(LoginActivity.this, "Connexion réussie !", Toast.LENGTH_SHORT).show();

                            // Redirection intelligente selon le bouton coché
                            if (isAdmin) {
                                Intent intent = new Intent(LoginActivity.this, AdminActivity.class);
                                startActivity(intent);
                            } else {
                                Intent intent = new Intent(LoginActivity.this, User1Activity.class);
                                startActivity(intent);
                            }
                            finish(); // Ferme la page de login
                        } else {
                            Toast.makeText(LoginActivity.this, "Erreur : " + jsonObject.getString("error"), Toast.LENGTH_SHORT).show();
                        }

                    } catch (JSONException e) {
                        e.printStackTrace();
                        // Si le JSON est mal formé mais que la requête a réussi (200 OK), on connecte quand même
                        Log.e("JSON_ERROR", "Erreur lecture JSON, mais connexion OK");
                        if (isAdmin) {
                            startActivity(new Intent(LoginActivity.this, AdminActivity.class));
                        } else {
                            startActivity(new Intent(LoginActivity.this, User1Activity.class));
                        }
                        finish();
                    }
                },
                error -> {
                    Log.e("API_ERREUR", "Erreur : " + error.toString());

                    if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
                        Toast.makeText(LoginActivity.this, "Email ou Mot de passe incorrect", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(LoginActivity.this, "Erreur réseau : Vérifiez le Wifi et l'IP du serveur", Toast.LENGTH_LONG).show();
                    }
                }) {
            @Override
            protected Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                // Envoi des infos au serveur
                params.put("email", email);
                params.put("password", password);
                return params;
            }
        };

        RequestQueue requestQueue = Volley.newRequestQueue(this);
        requestQueue.add(stringRequest);
    }
}
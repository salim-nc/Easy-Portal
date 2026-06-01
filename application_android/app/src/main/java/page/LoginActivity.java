package page;

import android.content.Intent;
import android.content.SharedPreferences; // IMPUT : Pour sauvegarder le token
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
    private RadioGroup rgRole;
    private RadioButton rbAdmin;
    private boolean isPasswordVisible = false;

    // --- LIENS DU SERVEUR ---
    // Assure-toi que l'IP est correcte
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
        rgRole = findViewById(R.id.rgRole);
        rbAdmin = findViewById(R.id.rbAdmin);

        // 2. Gestion de l'oeil (Mot de passe)
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
                if (rbAdmin.isChecked()) {
                    loginRequest(email, password, URL_LOGIN_ADMIN, true);
                } else {
                    loginRequest(email, password, URL_LOGIN_USER, false);
                }
            } else {
                Toast.makeText(LoginActivity.this, "Veuillez remplir tous les champs", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void loginRequest(final String email, final String password, String urlCible, boolean isAdmin) {
        Toast.makeText(this, "Connexion en cours...", Toast.LENGTH_SHORT).show();

        StringRequest stringRequest = new StringRequest(Request.Method.POST, urlCible,
                response -> {
                    Log.d("API_REPONSE", response);

                    try {
                        JSONObject jsonObject = new JSONObject(response);

                        // Vérification basique du succès
                        boolean success = jsonObject.has("success") && jsonObject.getBoolean("success");

                        // Parfois l'API renvoie juste le token sans "success: true", donc on vérifie aussi s'il n'y a pas d'erreur
                        if (success || !jsonObject.has("error")) {

                            String nom = "";
                            String prenom = "";
                            String token = ""; // Variable pour stocker le token

                            // --- 1. RECUPERATION DES DONNEES ---
                            if (jsonObject.has("data")) {
                                JSONObject dataObj = jsonObject.getJSONObject("data");

                                // Récupération du token s'il est dans "data"
                                token = dataObj.optString("token", "");

                                if (dataObj.has("user")) {
                                    JSONObject userObj = dataObj.getJSONObject("user");
                                    nom = userObj.optString("nom", "");
                                    prenom = userObj.optString("prenom", "");
                                }
                            }

                            // Si le token n'était pas dans "data", on regarde à la racine (certaines API font ça)
                            if (token.isEmpty()) {
                                token = jsonObject.optString("token", "");
                            }

                            // --- 2. SAUVEGARDE DU TOKEN (CRUCIAL POUR L'OUVERTURE DU PORTAIL) ---
                            if (!token.isEmpty()) {
                                SharedPreferences prefs = getSharedPreferences("UserPrefs", MODE_PRIVATE);
                                SharedPreferences.Editor editor = prefs.edit();
                                editor.putString("token", token);
                                editor.apply(); // Sauvegarde asynchrone
                                Log.d("LOGIN", "Token sauvegardé : " + token);
                            } else {
                                Log.w("LOGIN", "Aucun token trouvé dans la réponse !");
                            }

                            // --- 3. NAVIGATION ---
                            Toast.makeText(LoginActivity.this, "Connexion réussie !", Toast.LENGTH_SHORT).show();

                            if (isAdmin) {
                                Intent intent = new Intent(LoginActivity.this, AdminActivity.class);
                                startActivity(intent);
                            } else {
                                Intent intent = new Intent(LoginActivity.this, User1Activity.class);
                                intent.putExtra("USER_NOM", nom);
                                intent.putExtra("USER_PRENOM", prenom);
                                startActivity(intent);
                            }
                            finish();
                        } else {
                            String errorMsg = jsonObject.optString("message", "Erreur de connexion");
                            Toast.makeText(LoginActivity.this, "Erreur : " + errorMsg, Toast.LENGTH_SHORT).show();
                        }

                    } catch (JSONException e) {
                        e.printStackTrace();
                        Log.e("JSON_ERROR", "Erreur lecture JSON: " + e.getMessage());
                        Toast.makeText(LoginActivity.this, "Erreur format de réponse serveur", Toast.LENGTH_SHORT).show();
                    }
                },
                error -> {
                    if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
                        Toast.makeText(LoginActivity.this, "Identifiants incorrects", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(LoginActivity.this, "Erreur réseau / Serveur injoignable", Toast.LENGTH_LONG).show();
                    }
                    error.printStackTrace();
                }) {
            @Override
            protected Map<String, String> getParams() {
                Map<String, String> params = new HashMap<>();
                params.put("email", email);
                params.put("password", password);
                return params;
            }
        };

        RequestQueue requestQueue = Volley.newRequestQueue(this);
        requestQueue.add(stringRequest);
    }
}
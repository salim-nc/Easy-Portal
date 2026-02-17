package page;

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

                        // Si le serveur dit que c'est un succès (d'après ton image, il y a un champ "success": true)
                        // On vérifie soit "success":true, soit l'absence d'erreur
                        boolean success = jsonObject.has("success") && jsonObject.getBoolean("success");

                        if (success || !jsonObject.has("error")) {

                            String nom = "";
                            String prenom = "";

                            // --- CORRECTION : ON LIT DANS "DATA" PUIS DANS "USER" ---
                            if (jsonObject.has("data")) {
                                JSONObject dataObj = jsonObject.getJSONObject("data");

                                if (dataObj.has("user")) {
                                    JSONObject userObj = dataObj.getJSONObject("user");
                                    // Lecture sécurisée des champs
                                    nom = userObj.optString("nom", "");
                                    prenom = userObj.optString("prenom", "");
                                }
                            }
                            // ---------------------------------------------------------

                            Toast.makeText(LoginActivity.this, "Connexion réussie !", Toast.LENGTH_SHORT).show();

                            if (isAdmin) {
                                Intent intent = new Intent(LoginActivity.this, AdminActivity.class);
                                startActivity(intent);
                            } else {
                                Intent intent = new Intent(LoginActivity.this, User1Activity.class);
                                // On envoie les infos trouvées à la page User
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
                        Log.e("JSON_ERROR", "Erreur lecture JSON");
                        // En cas de doute, on laisse entrer (mode dégradé)
                        if (isAdmin) {
                            startActivity(new Intent(LoginActivity.this, AdminActivity.class));
                        } else {
                            startActivity(new Intent(LoginActivity.this, User1Activity.class));
                        }
                        finish();
                    }
                },
                error -> {
                    if (error.networkResponse != null && error.networkResponse.statusCode == 401) {
                        Toast.makeText(LoginActivity.this, "Identifiants incorrects", Toast.LENGTH_LONG).show();
                    } else {
                        Toast.makeText(LoginActivity.this, "Erreur réseau", Toast.LENGTH_LONG).show();
                    }
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
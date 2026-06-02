// ======================================================
// PROJET EASYPORTAL - ETUDIANT 3
// MISSION : PILOTAGE MCC ET SECURITE
// ======================================================
// --- 1. DECLARATION DES PINS ---
const int pinDirA = 12;   
const int pinPwmA = 3;    
const int pinBrakeA = 9;  
const int pinLED = 4;        
const int capteurOuvert = 2; 
const int capteurFerme = 6;
const int pinPresence = 5;
int vitesse = 40;

// --- 2. INITIALISATION ---
void setup() {
  pinMode(pinBrakeA, OUTPUT);  
  digitalWrite(pinBrakeA, HIGH);
  pinMode(pinPwmA, OUTPUT);
  analogWrite(pinPwmA, 0);
  pinMode(pinDirA, OUTPUT);
  digitalWrite(pinDirA, LOW); 
  Serial.begin(9600);
  pinMode(pinLED, OUTPUT); 
  pinMode(capteurOuvert, INPUT_PULLUP); 
  pinMode(capteurFerme, INPUT_PULLUP);
  pinMode(pinPresence, INPUT);
  Serial.println("--- SYSTEME EASYPORTAL : PRET ET VERROUILLE ---");
}

// --- 3. BOUCLE PRINCIPALE ---
void loop() {
  static unsigned long pM = 0;
  if (millis() - pM >= 1000) {
    pM = millis();
    if (digitalRead(pinPresence) == 0) {
      Serial.println("STATUS: [!] VOITURE DETECTEE [!]");
    } else {
      Serial.println("STATUS: Zone libre");
    }
  }

  if (Serial.available()) {
    char commande = Serial.read();
    if (commande == '1') {
      // Mode automatique : ouverture avec verification des capteurs
      if (digitalRead(pinPresence) == 0) {
        Serial.println("ACTION: Ouverture autorisee.");
        lancerCycle();
      } else {
        Serial.println("ERREUR: Ouverture refusee (Pas de voiture).");
      }
    }
    if (commande == '2') {
      // Mode manuel : ouverture forcee depuis site web ou app
      Serial.println("ACTION: Ouverture manuelle forcee.");
      lancerCycle();
    }
  }
}

// --- 4. FONCTIONS DE MOUVEMENT ---
void lancerCycle() {
  Serial.println("MOUVEMENT: Ouverture en cours...");
  digitalWrite(pinBrakeA, LOW);
  digitalWrite(pinDirA, HIGH);
  
  while(digitalRead(capteurOuvert) == 0) { 
    analogWrite(pinPwmA, vitesse); 
    clignoterLED(); 
  }
  stopper();
  Serial.println("ETAT: Portail Ouvert.");

  unsigned long debutVide = millis();
  while (millis() - debutVide < 3000) {
    clignoterLED();
    if (digitalRead(pinPresence) == 0) debutVide = millis(); 
  }

  Serial.println("MOUVEMENT: Fermeture en cours...");
  digitalWrite(pinBrakeA, LOW);
  digitalWrite(pinDirA, LOW);
  
  while(digitalRead(capteurFerme) == 0) {
    if (digitalRead(pinPresence) == 0) {
      stopper();
      Serial.println("ALERTE: Obstacle detecte ! Re-ouverture...");
      lancerCycle();
      return;
    }
    analogWrite(pinPwmA, vitesse);
    clignoterLED();
  }
  stopper();
  Serial.println("ETAT: Portail Ferme.");
}

void stopper() {
  analogWrite(pinPwmA, 0);
  digitalWrite(pinBrakeA, HIGH);
  digitalWrite(pinLED, LOW);
}

void clignoterLED() {
  digitalWrite(pinLED, (millis() / 300) % 2);
}

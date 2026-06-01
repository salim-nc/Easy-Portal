#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import serial
import json
import time

SERIAL_PORT = "/dev/ttyACM0"
SERIAL_BAUD = 9600

# Connexion série
try:
    ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
    time.sleep(2) # Temps pour le bootloader Arduino
    print(f"[SERIE] Connecté sur {SERIAL_PORT}")
except Exception as e:
    print(f"[SERIE] Erreur de connexion: {e}")
    ser = None

class PortalHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/open':
            if ser:
                try:
                    ser.write(b'2')
                    ser.flush() # Force l'envoi immédiat des données vers l'Arduino
                    print("[PORTAIL] Commande '2' envoyée")
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                except Exception as e:
                    print(f"[ERREUR] Impossible d'écrire sur le port série: {e}")
                    self.send_error(500, "Erreur materielle")
            else:
                print("[ERREUR] Arduino non détecté")
                self.send_error(503, "Arduino non disponible")
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        # Pour ne pas polluer la console avec les logs HTTP
        return

print("[SERVEUR] Serveur portail prêt sur le port 5000")
server = HTTPServer(('0.0.0.0', 5000), PortalHandler)
server.serve_forever()
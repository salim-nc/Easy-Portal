#!/usr/bin/env python3
"""
EasyPortal - Serveur de commande du portail
Recoit les requetes HTTP de l'API et envoie la commande serie a l'Arduino
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import serial
import json
import time

SERIAL_PORT = "/dev/ttyACM0"
SERIAL_BAUD = 9600

# Connexion serie
try:
    ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
    time.sleep(2)
    print(f"[SERIE] Connecte sur {SERIAL_PORT}")
except Exception as e:
    print(f"[SERIE] Erreur: {e}")
    ser = None

class PortalHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/open':
            if ser:
                ser.write(b'2')
                print("[PORTAIL] Commande d'ouverture envoyee a l'Arduino")
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Commande envoyee"}).encode())
            else:
                print("[PORTAIL] Erreur: pas de connexion serie")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": "Pas de connexion serie"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[HTTP] {args[0]}")

print("[SERVEUR] Serveur portail demarre sur le port 5000")
server = HTTPServer(('0.0.0.0', 5000), PortalHandler)
server.serve_forever()

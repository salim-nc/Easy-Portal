#!/usr/bin/env python3
"""
EasyPortal - Détection plaque améliorée
Utilise fast-alpr (YOLOv8-tiny + PaddleOCR) — optimisé Raspberry Pi 4
"""

import cv2
import numpy as np
import serial
import requests
import time
import re
import threading
from collections import Counter
from fast_alpr import ALPR  # pip install fast-alpr

# ===== CONFIGURATION =====
SERIAL_PORT          = "/dev/ttyACM0"
SERIAL_BAUD          = 9600
API_URL              = "http://api:3000"
CAMERA_URL           = "http://camera:8000/stream.mjpg"
CONFIDENCE_THRESHOLD = 0.75   # Seuil minimum pour accepter une lecture
MAX_FRAME_WIDTH      = 640    # Résolution réduite pour accélérer l'inférence sur RPi4

# ===== INITIALISATION ALPR =====
# Modèle "tiny" = le plus léger, adapté RPi 4 (~2-3s par frame)
# Les modèles sont téléchargés automatiquement au premier lancement
alpr = ALPR(
    detector_model="yolo-v9-t-384-license-plate-end2end",
    ocr_model="global-plates-mobile-vit-v2-model",
)

# ===== CAPTURE =====
def capture_frame():
    cap = cv2.VideoCapture(CAMERA_URL)
    # Flush du buffer MJPEG : on lit plusieurs frames pour avoir la plus récente
    for _ in range(3):
        ret, frame = cap.read()
    cap.release()
    if ret:
        return frame
    print("[CAMERA] Erreur de capture")
    return None

# ===== PRÉTRAITEMENT FRAME =====
def preprocess_frame(frame, max_width=MAX_FRAME_WIDTH):
    """
    Réduit la résolution si nécessaire.
    Gain ~40% de vitesse d'inférence sur RPi 4.
    """
    h, w = frame.shape[:2]
    if w > max_width:
        scale = max_width / w
        frame = cv2.resize(frame, (max_width, int(h * scale)))
    return frame

# ===== DÉTECTION VÉHICULE (pré-filtre rapide) =====
def detect_vehicle(frame):
    """
    Pré-filtre léger pour éviter de lancer ALPR sur des frames vides.
    Détection rapide par analyse de contours significatifs.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (21, 21), 0)
    _, thresh = cv2.threshold(blur, 0, 255,
                              cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        if cv2.contourArea(c) > 8000:
            return True
    return False

# ===== LECTURE PLAQUE (fast-alpr) =====
def read_plate_from_frame(frame):
    frame = preprocess_frame(frame)
    results = alpr.predict(frame)

    best_plate = None
    best_conf  = 0.0

    for result in results:
        if result.ocr is None:
            continue
        text = result.ocr.text.upper().replace(" ", "")
        raw_conf = result.ocr.confidence
        conf = float(sum(raw_conf) / len(raw_conf)) if isinstance(raw_conf, list) else float(raw_conf)

        print(f"[ALPR] Brut: '{text}'  confiance: {conf:.2f}")  

        if conf < CONFIDENCE_THRESHOLD:
            continue

        text = re.sub(r'[^A-Z0-9]', '', text)

        match = re.match(r'^([A-Z]{2})(\d{3})([A-Z]{2})$', text)
        if match:
            formatted = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
            if conf > best_conf:
                best_plate = formatted
                best_conf  = conf

    if best_plate:
        print(f"[ALPR] Plaque: {best_plate}  (confiance: {best_conf:.2f})")

    return best_plate, best_conf

# ===== VOTE MAJORITAIRE SUR N FRAMES =====
def read_plate_multi(max_attempts=5):
    """
    Capture plusieurs frames et retourne la plaque la plus fréquente
    parmi les lectures valides, pondérée par la confiance.
    """
    readings = []

    for i in range(max_attempts):
        frame = capture_frame()
        if frame is None:
            continue

        plate, conf = read_plate_from_frame(frame)
        if plate:
            readings.append((plate, conf))
            print(f"[ALPR] Lecture {i+1}/{max_attempts}: {plate} ({conf:.2f})")

        time.sleep(0.3)

    if not readings:
        print("[ALPR] Aucune plaque détectée après toutes les tentatives")
        return None

    # Vote pondéré par la confiance (meilleur qu'un simple comptage)
    vote_scores = Counter()
    for plate, conf in readings:
        vote_scores[plate] += conf

    best = vote_scores.most_common(1)[0][0]
    n    = sum(1 for p, _ in readings if p == best)
    print(f"[ALPR] Résultat final: {best}")
    return best

# ===== VÉRIFICATION API =====
def verify_plate(numero):
    try:
        response = requests.post(
            f"{API_URL}/api/plaques/verify",
            json={"numero": numero},
            timeout=5
        )
        data = response.json()
        print(f"[API] {numero}: {data.get('message', 'Erreur')}")
        return data.get("authorized", False)
    except Exception as e:
        print(f"[API] Erreur: {e}")
        return False

# ===== TRAITEMENT VÉHICULE (dans un thread séparé) =====
def handle_vehicle(ser):
    """
    Traitement complet : capture → détection → OCR → API → portail.
    Exécuté dans un thread pour ne pas bloquer la lecture du port série.
    """
    frame = capture_frame()
    if frame is None:
        print("[ERREUR] Impossible de capturer l'image")
        return

    if not detect_vehicle(frame):
        print("[FILTRE] Pas de véhicule confirmé, ignoré.")
        return

    print("[CONTOUR] Véhicule confirmé devant le portail")

    plate = read_plate_multi(max_attempts=5)

    if plate is None:
        print("[ALPR] Impossible de lire la plaque")
        return

    authorized = verify_plate(plate)

    if authorized:
        print(f"[PORTAIL] {plate} → AUTORISÉE — Ouverture!")
        if ser:
            ser.write(b'1')
    else:
        print(f"[PORTAIL] {plate} → REFUSÉE — Pas d'ouverture")

# ===== PROGRAMME PRINCIPAL =====
def main():
    print("=" * 50)
    print("   EASYPORTAL — fast-alpr (YOLOv8-tiny + PaddleOCR)")
    print("   Optimisé Raspberry Pi 4")
    print("=" * 50)

    try:
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
        time.sleep(2)  # Attendre l'initialisation de l'Arduino
        print(f"[SERIE] Connecté sur {SERIAL_PORT}")
    except Exception as e:
        print(f"[SERIE] Erreur: {e}")
        ser = None

    print("[SYSTEME] En attente de détection...\n")

    while True:
        if ser and ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()

            if "VOITURE DETECTEE" in line:
                print("\n[CAPTEUR] Signal infrarouge reçu!")
                # Thread séparé : la boucle série reste réactive pendant le traitement
                t = threading.Thread(target=handle_vehicle, args=(ser,))
                t.daemon = True
                t.start()

        time.sleep(0.1)

if __name__ == "__main__":
    main()
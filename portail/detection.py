#!/usr/bin/env python3
"""
EasyPortal - Script de detection de vehicule et lecture de plaque
Etudiant 2 : Detection contour (OpenCV) + OCR plaque + commande portail
"""

import cv2
import numpy as np
import pytesseract
import serial
import requests
import time
import re

# ===== CONFIGURATION =====
SERIAL_PORT = "/dev/ttyACM0"
SERIAL_BAUD = 9600
API_URL = "http://api:3000"
CAMERA_URL = "http://camera:8000/stream.mjpg"
MIN_CONTOUR_AREA = 500  # Baisse pour maquette (etait 5000)
SKIP_CONTOUR = False  # Mettre True pour ignorer la detection de contour

# ===== CAPTURE IMAGE DEPUIS FLUX CAMERA =====
def capture_frame():
    cap = cv2.VideoCapture(CAMERA_URL)
    ret, frame = cap.read()
    cap.release()
    if ret:
        return frame
    print("[CAMERA] Erreur de capture")
    return None

# ===== DETECTION DE CONTOUR (VEHICULE) =====
def detect_contour(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Seuillage adaptatif
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY_INV, 11, 2)
    
    # Dilatation pour relier les contours proches
    kernel = np.ones((5, 5), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    
    # Trouver les contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > MIN_CONTOUR_AREA:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            
            # Un vehicule est generalement plus large que haut
            if 0.3 < aspect_ratio < 6.0:  # Elargi pour maquette
                print(f"[CONTOUR] Objet detecte: {w}x{h} pixels (aire: {area})")
                return True, (x, y, w, h)
    
    print("[CONTOUR] Aucun objet significatif detecte")
    return False, None

# ===== EXTRACTION PLAQUE DEPUIS TEXTE OCR =====
def extract_plate_from_text(text):
    """Nettoie le texte OCR et cherche un format de plaque francaise"""
    text = text.strip().replace(' ', '').replace('\n', '').upper()
    # Nettoyer les caracteres speciaux
    text = re.sub(r'[^A-Z0-9]', '', text)
    
    # Chercher format plaque francaise dans le texte (meme si ya du bruit autour)
    match = re.search(r'([A-Z]{2})(\d{3})([A-Z]{2})', text)
    if match:
        plate_text = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
        return plate_text
    return None

# ===== DETECTION ET LECTURE DE PLAQUE =====
def read_plate(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # === METHODE 1 : Chercher un rectangle de plaque ===
    gray_filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    edges = cv2.Canny(gray_filtered, 30, 200)
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:15]

    for contour in contours:
        approx = cv2.approxPolyDP(contour, 0.018 * cv2.arcLength(contour, True), True)
        
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = w / float(h)
            
            # Criteres elargis pour maquette
            if 1.5 < aspect_ratio < 7.0 and w > 30:
                plate_img = gray[y:y+h, x:x+w]
                plate_img = cv2.resize(plate_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
                _, plate_img = cv2.threshold(plate_img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                
                text = pytesseract.image_to_string(plate_img, config='--psm 7 --oem 3')
                plate = extract_plate_from_text(text)
                if plate:
                    print(f"[OCR] Plaque lue (methode rectangle): {plate}")
                    return plate

    # === METHODE 2 : OCR sur l'image entiere (fallback pour maquette) ===
    gray_resized = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    _, gray_thresh = cv2.threshold(gray_resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    
    for psm in ['--psm 6 --oem 3', '--psm 11 --oem 3', '--psm 3 --oem 3']:
        text = pytesseract.image_to_string(gray_thresh, config=psm)
        plate = extract_plate_from_text(text)
        if plate:
            print(f"[OCR] Plaque lue (methode fullscan): {plate}")
            return plate

    print("[OCR] Aucune plaque detectee")
    return None

# ===== TENTATIVES MULTIPLES DE LECTURE =====
def read_plate_multi(max_attempts=3):
    """Prend plusieurs photos et garde le meilleur resultat"""
    results = []
    
    for i in range(max_attempts):
        frame = capture_frame()
        if frame is None:
            continue
        plate = read_plate(frame)
        if plate:
            results.append(plate)
        time.sleep(0.5)
    
    if not results:
        return None
    
    # Retourner la plaque la plus frequente
    from collections import Counter
    most_common = Counter(results).most_common(1)[0][0]
    print(f"[OCR] Resultat final: {most_common} ({len(results)}/{max_attempts} lectures)")
    return most_common

# ===== VERIFICATION API =====
def verify_plate(numero):
    try:
        response = requests.post(
            f"{API_URL}/api/plaques/verify",
            json={"numero": numero},
            timeout=5
        )
        data = response.json()
        print(f"[API] Plaque {numero}: {data.get('message', 'Erreur')}")
        return data.get("authorized", False)
    except Exception as e:
        print(f"[API] Erreur: {e}")
        return False

# ===== PROGRAMME PRINCIPAL =====
def main():
    print("=" * 50)
    print("   EASYPORTAL - Systeme de detection")
    print("   Detection de contour + OCR + API")
    print("=" * 50)

    # Initialiser la liaison serie avec Arduino
    try:
        ser = serial.Serial(SERIAL_PORT, SERIAL_BAUD, timeout=1)
        time.sleep(2)  # Attendre initialisation Arduino
        print(f"[SERIE] Connecte sur {SERIAL_PORT}")
    except Exception as e:
        print(f"[SERIE] Erreur: {e}")
        ser = None

    if SKIP_CONTOUR:
        print("[CONFIG] Mode maquette: detection de contour DESACTIVEE")
    else:
        print(f"[CONFIG] Seuil contour: {MIN_CONTOUR_AREA} pixels")

    print("[SYSTEME] En attente de detection...")
    print("")

    while True:
        # Lire les messages de l Arduino
        if ser and ser.in_waiting > 0:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            
            if "VOITURE DETECTEE" in line:
                print("\n[CAPTEUR] Objet detecte par infrarouge!")
                
                # Etape 1 : Capturer une image
                frame = capture_frame()
                if frame is None:
                    print("[ERREUR] Impossible de capturer l image")
                    continue

                # Etape 2 : Confirmer la presence avec detection de contour
                if not SKIP_CONTOUR:
                    detected, bbox = detect_contour(frame)
                    
                    if not detected:
                        print("[CONTOUR] Aucun objet significatif. Ignore.")
                        continue

                    print("[CONTOUR] Objet confirme devant le portail")
                else:
                    print("[CONTOUR] Skip (mode maquette)")

                # Etape 3 : Lire la plaque (plusieurs tentatives)
                plate = read_plate_multi(max_attempts=3)
                
                if plate is None:
                    print("[OCR] Impossible de lire la plaque")
                    continue

                # Etape 4 : Verifier en BDD via API
                authorized = verify_plate(plate)

                if authorized:
                    print(f"[PORTAIL] Plaque {plate} AUTORISEE - Ouverture!")
                    if ser:
                        ser.write(b'1')
                else:
                    print(f"[PORTAIL] Plaque {plate} REFUSEE - Pas d ouverture")

        time.sleep(0.1)

if __name__ == "__main__":
    main()
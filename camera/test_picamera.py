#!/usr/bin/env python3
from picamera2 import Picamera2
import time

print("Initialisation de la caméra...")
picam2 = Picamera2()

config = picam2.create_still_configuration()
picam2.configure(config)

print("Démarrage de la caméra...")
picam2.start()

time.sleep(2)

print("Capture de l'image...")
picam2.capture_file("test_camera.jpg")

print("✓ Image capturée : test_camera.jpg")

picam2.stop()
print("Terminé !")
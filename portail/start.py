#!/usr/bin/env python3
"""
EasyPortal - Lanceur des services portail
Lance portal_server.py et detection.py en parallele
"""
import subprocess
import sys
import os
import signal

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("   EASYPORTAL - Services Portail")
print("=" * 50)
sys.stdout.flush()

# Lancer portal_server.py en background
print("[START] Lancement du serveur portail (port 5000)...")
sys.stdout.flush()
server = subprocess.Popen(
    [sys.executable, "-u", "portal_server.py"],
    stdout=sys.stdout,
    stderr=sys.stderr,
    bufsize=1
)

# Lancer detection.py en background aussi
print("[START] Lancement de la detection...")
sys.stdout.flush()
detection = subprocess.Popen(
    [sys.executable, "-u", "detection.py"],
    stdout=sys.stdout,
    stderr=sys.stderr,
    bufsize=1
)

def signal_handler(sig, frame):
    print("\n[STOP] Arret des services...")
    sys.stdout.flush()
    server.terminate()
    detection.terminate()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# Attendre que les deux tournent
try:
    server.wait()
    detection.wait()
except KeyboardInterrupt:
    signal_handler(None, None)

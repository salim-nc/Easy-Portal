#!/usr/bin/env python3
import io
import sys
from threading import Condition
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from picamera2 import Picamera2
from picamera2.encoders import MJPEGEncoder
from picamera2.outputs import FileOutput

class StreamingOutput(io.BufferedIOBase):
    def __init__(self):
        self.frame = None
        self.condition = Condition()

    def write(self, buf):
        with self.condition:
            self.frame = buf
            self.condition.notify_all()

class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class StreamingHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        if '/stream.mjpg' in args[0]:
            return
        super().log_message(format, *args)

    def do_GET(self):
        if self.path == '/':
            self.send_response(301)
            self.send_header('Location', '/stream.html')
            self.end_headers()
        elif self.path == '/stream.html':
            content = """
            <html>
            <head><title>Pi Camera Stream</title></head>
            <body style="background:#1a1a1a; color:white; text-align:center;">
                <h1>Flux Video - EasyPortal</h1>
                <img src="/stream.mjpg" style="max-width:90%; border:3px solid #4CAF50;"/>
            </body>
            </html>
            """.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Content-Length', len(content))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == '/stream.mjpg':
            self.send_response(200)
            self.send_header('Age', 0)
            self.send_header('Cache-Control', 'no-cache, private')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Content-Type', 'multipart/x-mixed-replace; boundary=FRAME')
            self.end_headers()
            try:
                while True:
                    with output.condition:
                        output.condition.wait()
                        frame = output.frame
                    self.wfile.write(b'--FRAME\r\n')
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', len(frame))
                    self.end_headers()
                    self.wfile.write(frame)
                    self.wfile.write(b'\r\n')
            except (ConnectionResetError, BrokenPipeError):
                pass
            except Exception as e:
                print(f"Erreur flux: {e}")
        else:
            self.send_error(404)
            self.end_headers()

# --- INIT ---
print("Lancement de la caméra...")
picam2 = Picamera2()
config = picam2.create_video_configuration(main={"size": (640, 480)})
picam2.configure(config)
output = StreamingOutput()
encoder = MJPEGEncoder()
picam2.start_recording(encoder, FileOutput(output))

try:
    server = ThreadingHTTPServer(('', 8000), StreamingHandler)
    print("Serveur en ligne sur le port 8000")
    server.serve_forever()
finally:
    print("Fermeture propre...")
    picam2.stop_recording()
    picam2.close()
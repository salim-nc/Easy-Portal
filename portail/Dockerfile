FROM debian:bookworm-slim

WORKDIR /app

# Installer Python, pip, et les dépendances système pour OpenCV et Tesseract
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    tesseract-ocr \
    tesseract-ocr-fra \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Installer les packages Python
RUN pip3 install --no-cache-dir --break-system-packages \
    opencv-python-headless \
    numpy \
    pytesseract \
    pyserial \
    requests

COPY . .

EXPOSE 5000

CMD ["/usr/bin/python3", "-u", "start.py"]
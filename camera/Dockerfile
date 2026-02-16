FROM debian:bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    python3-numpy \
    python3-prctl \
    libcamera0.0.3 \
    libcamera-dev \
    libcap-dev \
    build-essential \
    cmake \
    git \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages picamera2
COPY . .
EXPOSE 8000
CMD ["python3", "camera_stream.py"]
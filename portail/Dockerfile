FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    libgl1-mesa-glx libglib2.0-0 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --break-system-packages \
    onnxruntime \
    opencv-python-headless \
    fast-alpr \
    pyserial \
    requests

COPY . .

EXPOSE 5000

CMD ["/usr/bin/python3", "-u", "start.py"]
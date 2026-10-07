"""Local-only, opt-in image inference. Never actuates motors."""

import asyncio
import base64
import binascii
import io
import json
import os
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from PIL import Image, UnidentifiedImageError

app = FastAPI(title="Kestrel detector", version="0.1.0")
MAX_MESSAGE = 2_000_000
Image.MAX_IMAGE_PIXELS = 2_000_000
detector = None
load_error = "Set KESTREL_MODEL to a trained local model, then restart the service."
model_path = os.environ.get("KESTREL_MODEL")
if model_path:
    try:
        if not Path(model_path).exists():
            raise ValueError(
                "Model file does not exist; automatic downloads are disabled."
            )
        from ultralytics import YOLO

        detector = YOLO(model_path, task="detect")
        if "drone" not in [str(n).lower() for n in detector.names.values()]:
            raise ValueError("Model must contain a class named 'drone'.")
        load_error = ""
    except Exception as exc:
        detector = None
        load_error = f"Model unavailable: {exc}"


def decode_image(value: str) -> Image.Image:
    if not isinstance(value, str) or len(value) > MAX_MESSAGE:
        raise ValueError("Image payload is too large or is not a string.")
    if not value.startswith(("data:image/jpeg;base64,", "data:image/png;base64,")):
        raise ValueError("Expected a JPEG or PNG data URL.")
    try:
        raw = base64.b64decode(value.split(",", 1)[1], validate=True)
        image = Image.open(io.BytesIO(raw))
        if image.width * image.height > 2_000_000:
            raise ValueError("Image exceeds two megapixels.")
        image.load()
        return image.convert("RGB")
    except (
        binascii.Error,
        UnidentifiedImageError,
        OSError,
        Image.DecompressionBombError,
    ) as exc:
        raise ValueError("Invalid image.") from exc


def predict(image: Image.Image) -> list[dict]:
    if detector is None:
        raise RuntimeError(load_error)
    results = detector.predict(image, imgsz=320, conf=0.35, verbose=False)[0]
    found = []
    for box in results.boxes:
        cls = int(box.cls.item())
        if str(detector.names[cls]).lower() != "drone":
            continue
        x1, y1, x2, y2 = box.xyxyn[0].tolist()
        found.append(
            {"box": [x1, y1, x2 - x1, y2 - y1], "confidence": float(box.conf.item())}
        )
    return sorted(found, key=lambda d: d["confidence"], reverse=True)


@app.get("/health")
def health():
    return {
        "service": "kestrel",
        "model_ready": detector is not None,
        "detail": load_error,
    }


@app.websocket("/ws/detect")
async def detect_socket(ws: WebSocket):
    origin = ws.headers.get("origin", "")
    if origin and urlparse(origin).hostname not in {"localhost", "127.0.0.1", "::1"}:
        await ws.close(code=1008)
        return
    await ws.accept()
    try:
        while True:
            raw = await ws.receive_text()
            if len(raw) > MAX_MESSAGE:
                await ws.close(code=1009)
                return
            request_id = None
            try:
                payload = json.loads(raw)
                if not isinstance(payload, dict):
                    raise ValueError("Expected an object.")
                request_id = payload.get("id")
                if not isinstance(request_id, int) or isinstance(request_id, bool):
                    raise ValueError("A numeric frame id is required.")
                image = decode_image(payload.get("image"))
                if detector is None:
                    await ws.send_json({"id": request_id, "error": load_error})
                    continue
                detections = await asyncio.to_thread(predict, image)
                await ws.send_json({"id": request_id, "detections": detections})
            except (ValueError, TypeError, KeyError, RuntimeError) as exc:
                await ws.send_json({"id": request_id, "error": str(exc)})
    except WebSocketDisconnect:
        pass

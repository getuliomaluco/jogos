import base64
import io
import json
import os
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request

DEFAULT_LABEL = os.environ.get("DEFAULT_LABEL", "minimapopencv")
IMAGES_DIR = os.environ.get("IMAGES_DIR", str(Path(__file__).resolve().parents[1] / "assets" / "minimap" / "images"))
MAX_IMAGES = int(os.environ.get("MAX_IMAGES", "0"))

app = Flask(__name__)

templates = {}

def load_templates():
    base = Path(IMAGES_DIR)
    if not base.exists():
        return

    subdirs = [p for p in base.iterdir() if p.is_dir()]
    if subdirs:
        for sub in subdirs:
            label = sub.name
            templates[label] = _load_images(sub)
    else:
        templates[DEFAULT_LABEL] = _load_images(base)

def _load_images(folder: Path):
    files = list(folder.glob("*.png")) + list(folder.glob("*.jpg")) + list(folder.glob("*.jpeg"))
    if MAX_IMAGES > 0:
        files = files[:MAX_IMAGES]
    out = []
    for f in files:
        img = cv2.imread(str(f), cv2.IMREAD_GRAYSCALE)
        if img is None:
            continue
        out.append((f.name, img))
    return out

def decode_image(data_url: str):
    if not data_url:
        return None
    if data_url.startswith("data:"):
        _, b64 = data_url.split(",", 1)
    else:
        b64 = data_url
    raw = base64.b64decode(b64)
    arr = np.frombuffer(raw, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)

def match_templates(roi_gray, template_list):
    best = (None, 0.0)
    rh, rw = roi_gray.shape[:2]
    for name, tmpl in template_list:
        th, tw = tmpl.shape[:2]
        if th == 0 or tw == 0 or rh == 0 or rw == 0:
            continue
        if th > rh or tw > rw:
            resized = cv2.resize(tmpl, (rw, rh), interpolation=cv2.INTER_AREA)
            res = cv2.matchTemplate(roi_gray, resized, cv2.TM_CCOEFF_NORMED)
        else:
            res = cv2.matchTemplate(roi_gray, tmpl, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(res)
        if max_val > best[1]:
            best = (name, float(max_val))
    return best

@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    return resp

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "labels": list(templates.keys())})

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    if request.method == "OPTIONS":
        return ("", 204)

    payload = request.get_json(silent=True) or {}
    label = (payload.get("label") or "").strip()
    threshold = float(payload.get("threshold", 0.85))

    if not templates:
        return jsonify({"error": "no templates loaded", "match": False}), 500

    roi = decode_image(payload.get("image_b64", ""))
    if roi is None:
        return jsonify({"error": "invalid image", "match": False}), 400

    if label and label in templates:
        name, score = match_templates(roi, templates[label])
        return jsonify({"match": score >= threshold, "score": score, "label": label, "template": name})

    best_label = None
    best_name = None
    best_score = 0.0
    for lab, items in templates.items():
        name, score = match_templates(roi, items)
        if score > best_score:
            best_score = score
            best_label = lab
            best_name = name

    return jsonify({
        "match": best_score >= threshold,
        "score": best_score,
        "label": best_label or label,
        "template": best_name
    })

if __name__ == "__main__":
    load_templates()
    port = int(os.environ.get("PORT", "5005"))
    app.run(host="127.0.0.1", port=port)

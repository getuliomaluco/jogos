import time
import random
import pytesseract
import cv2
import numpy as np
from mss import mss
import subprocess
import sys
import re
from datetime import datetime

# ===============================
# CONFIG
# ===============================

CHAT_REGION = {
    "top": 909,
    "left": 1,
    "width": 1561,
    "height": 112
}

BATTLE_LIST_REGION = {
    "top": 454,
    "left": 1750,
    "width": 151,
    "height": 248
}

LOOT_REGEX = re.compile(r"(\d{2}:?\d{2}).*Loot\s+of", re.IGNORECASE)

PEGA_LOOT_POINTS = [
    (715, 379),
    (781, 385),
    (859, 392),
    (850, 449),
    (782, 439),
    (727, 442),
    (719, 516),
    (780, 518),
    (847, 520)
]

LOG_FILE = "amazonknight.log"

# ===============================
# LOG
# ===============================

def log(msg):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")

# ===============================
# OCR CHAT
# ===============================

def ler_chat():
    with mss() as sct:
        img = np.array(sct.grab(CHAT_REGION))

    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    _, thresh = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY_INV)

    texto = pytesseract.image_to_string(thresh, config="--psm 6")
    linhas = [l.strip() for l in texto.split("\n") if l.strip()]

    for linha in reversed(linhas):
        linha_limpa = linha.replace("|oot", "Loot").replace("L00t", "Loot").replace("loot 0f", "Loot of")

        m = LOOT_REGEX.search(linha_limpa)
        if m:
            ts = m.group(1)
            if ":" not in ts:
                ts = ts[:2] + ":" + ts[2:]
            return ts, linha_limpa

    return None, None

# ===============================
# BATTLE LIST
# ===============================

def tem_amazon_battle_list():
    with mss() as sct:
        img = np.array(sct.grab(BATTLE_LIST_REGION))

    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
    _, thresh = cv2.threshold(gray, 140, 255, cv2.THRESH_BINARY)

    texto = pytesseract.image_to_string(thresh, config="--psm 6")
    return "amazon" in texto.lower()

def tem_amazon_selecionada():
    with mss() as sct:
        img = np.array(sct.grab(BATTLE_LIST_REGION))

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    lower1 = np.array([0, 120, 120])
    upper1 = np.array([10, 255, 255])
    lower2 = np.array([160, 120, 120])
    upper2 = np.array([180, 255, 255])

    mask = cv2.inRange(hsv, lower1, upper1) + cv2.inRange(hsv, lower2, upper2)
    return cv2.countNonZero(mask) > 70

# ===============================
# CONTROLES
# ===============================

def press(key):
    subprocess.run(["xdotool", "key", key])

def click_shift_right(x, y):
    subprocess.run(["xdotool", "mousemove", str(x), str(y)])
    subprocess.run(["xdotool", "keydown", "Shift"])
    subprocess.run(["xdotool", "click", "3"])
    subprocess.run(["xdotool", "keyup", "Shift"])

def pegaloot():
    log("⚡ Executando PEGALOOT")
    for (x, y) in PEGA_LOOT_POINTS:
        time.sleep(random.uniform(0.04, 0.07))
        click_shift_right(x, y)
    log("✓ Loot coletado")

# ===============================
# MAIN LOOP
# ===============================

def main():

    log("⚔️ AMAZONKNIGHT iniciado!")
    ultimo_timestamp = None
    ciclos = 0

    press("space")
    time.sleep(0.5)

    while True:

        # 1️⃣ PRIORIDADE MÁXIMA: verificar LOOT primeiro
        timestamp, linha = ler_chat()

        if timestamp and timestamp != ultimo_timestamp:
            ultimo_timestamp = timestamp
            ciclos += 1
            log(f"🎉 LOOT DETECTADO! Ciclo #{ciclos}")
            log(f"📜 {linha}")

            time.sleep(1)
            pegaloot()
            time.sleep(0.2)
            continue   # <-- volta ao começo SEM atacar nada

        # 2️⃣ Verifica seleção vermelha → significa que está matando agora
        if tem_amazon_selecionada():
            log("🔴 Amazon selecionada — aguardando loot...")
            time.sleep(0.4)
            continue

        # 3️⃣ Somente se NÃO há loot pendente E NÃO há seleção vermelha
        if tem_amazon_battle_list():
            log("🎯 Amazon detectada → atacando")
            press("space")
            time.sleep(random.uniform(0.20, 0.35))
            continue

        time.sleep(0.2)

if __name__ == "__main__":
    main()

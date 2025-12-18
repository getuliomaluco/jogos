import subprocess
import time
from logger import log

DELAY = 0.1  # 100ms padrão entre ações


def _move(x, y):
    subprocess.run(["xdotool", "mousemove", str(x), str(y)])
    log(f"🟦 MOVE  x={x} y={y}")
    time.sleep(DELAY)


def click(x, y):
    _move(x, y)
    subprocess.run(["xdotool", "click", "1"])
    log(f"🟩 CLICK x={x} y={y}")
    time.sleep(DELAY)


def right_click(x, y):
    _move(x, y)
    subprocess.run(["xdotool", "click", "3"])
    log(f"🟥 RCLICK x={x} y={y}")
    time.sleep(DELAY)


def right_click_double(x, y):
    _move(x, y)
    subprocess.run(["xdotool", "click", "3"])
    time.sleep(DELAY)
    subprocess.run(["xdotool", "click", "3"])
    log(f"🟥 RCLICK x2 x={x} y={y}")
    time.sleep(DELAY)


def type_text(text: str):
    subprocess.run(["xdotool", "type", "--delay", "40", text])
    log(f"⌨️ TYPE '{text}'")
    time.sleep(DELAY)


def clear_input():
    subprocess.run(["xdotool", "key", "ctrl+a"])
    time.sleep(DELAY)
    subprocess.run(["xdotool", "key", "BackSpace"])
    log("🧹 CLEAR INPUT")
    time.sleep(DELAY)


def press_key(key: str):
    subprocess.run(["xdotool", "key", key])
    log(f"⌨️ KEY {key}")
    time.sleep(DELAY)

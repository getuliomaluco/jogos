import subprocess
import time
import random
from datetime import datetime
from threading import Thread
from pynput import keyboard

LOGFILE = "/home/getulio/macro_loop.log"

# =============== LOG COLORIDO ===============
RESET = "\033[0m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"

def log(msg, color=RESET):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(color + line + RESET)

    with open(LOGFILE, "a") as f:
        f.write(line + "\n")


# =============== COORDENADAS ===============
coords = [
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

LOOPS = 500
stop_script = False   # <- variável global para parar no F12


# =============== LISTENER DO F12 PARA PARAR ===============
def on_key_press(key):
    global stop_script
    try:
        if key == keyboard.Key.f12:
            stop_script = True
            log("▶ F12 pressionado — ENCERRANDO SCRIPT!", RED)
            return False
    except:
        pass

listener = keyboard.Listener(on_press=on_key_press)
listener.start()


# =============== FUNÇÃO DO MACRO DE CLIQUES ===============
def run_click_macro():
    log("Executando macro SHIFT+RightClick", CYAN)

    for (x, y) in coords:
        if stop_script:
            return

        log(f" → Click em ({x},{y})", YELLOW)

        subprocess.run(["xdotool", "mousemove", str(x), str(y)])
        time.sleep(random.uniform(0.015, 0.030))

        subprocess.run(["xdotool", "keydown", "Shift_L"])
        time.sleep(random.uniform(0.015, 0.030))

        subprocess.run(["xdotool", "click", "3"])
        time.sleep(random.uniform(0.015, 0.030))

        subprocess.run(["xdotool", "keyup", "Shift_L"])
        time.sleep(random.uniform(0.015, 0.030))

    log("✔ Macro concluída.", GREEN)


# =============== LOOP PRINCIPAL ===============
def main():
    global stop_script
    log("🔵 Script iniciado. Pressione F12 para encerrar a qualquer momento.", CYAN)

    for i in range(1, LOOPS + 1):
        if stop_script:
            break

        log(f"🔁 Ciclo {i}/{LOOPS}", CYAN)

        subprocess.run(["xdotool", "key", "space"])
        log("␣ Barra de espaço pressionada", GREEN)

        time.sleep(10)  # tempo fixo

        run_click_macro()

    log("🏁 Script encerrado.", RED if stop_script else GREEN)


if __name__ == "__main__":
    main()

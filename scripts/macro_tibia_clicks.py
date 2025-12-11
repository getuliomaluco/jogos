from pynput import mouse
import subprocess
import time

# Lista das coordenadas capturadas
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

DELAY = 0.020   # 20 ms

def run_macro():
    for (x, y) in coords:
        # mover mouse
        subprocess.run(["xdotool", "mousemove", str(x), str(y)])
        time.sleep(DELAY)

        # Segurar SHIFT
        subprocess.run(["xdotool", "keydown", "Shift_L"])
        time.sleep(DELAY)

        # botão direito
        subprocess.run(["xdotool", "click", "3"])
        time.sleep(DELAY)

        # soltar SHIFT
        subprocess.run(["xdotool", "keyup", "Shift_L"])
        time.sleep(DELAY)

    print("✅ Macro finalizada!")

def on_click(x, y, button, pressed):
    if button == mouse.Button.middle and pressed:
        print("🚀 Botão do meio clicado → iniciando macro...")
        run_macro()

listener = mouse.Listener(on_click=on_click)
listener.start()
listener.join()

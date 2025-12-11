from pynput import mouse

def on_click(x, y, button, pressed):
    if pressed:
        print(f"[CLICK] Botão={button}  X={x}  Y={y}")

listener = mouse.Listener(on_click=on_click)
listener.start()
listener.join()

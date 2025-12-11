from pynput import mouse
import subprocess

def on_click(x, y, button, pressed):
    if button == mouse.Button.middle and pressed:
        print(f"[BOTÃO DO MEIO] Mouse está em X={x}, Y={y}")

        # Teste: clicar na mesma posição (pode mudar depois)
        subprocess.run(["xdotool", "click", "1"])
        print("Clique esquerdo enviado pelo xdotool")

listener = mouse.Listener(on_click=on_click)
listener.start()
listener.join()

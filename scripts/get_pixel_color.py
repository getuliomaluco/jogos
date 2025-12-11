import mss
import numpy as np
from pynput import mouse

def on_click(x, y, button, pressed):
    if pressed:
        print(f"📌 Clique detectado em X={x} Y={y}")
        with mss.mss() as sct:
            region = {"top": y, "left": x, "width": 1, "height": 1}
            img = np.array(sct.grab(region))
            b, g, r = img[0, 0][:3]
            print(f"🎨 COR DO PIXEL → R={r}  G={g}  B={b}")
        return False  # encerra após 1 clique

with mouse.Listener(on_click=on_click) as listener:
    listener.join()

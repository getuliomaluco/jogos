import time
import cv2
import numpy as np
from mss import mss

# ⚠️ AJUSTE ESSAS COORDENADAS PARA O SEU MINIMAPA
MINIMAP_REGION = {
    "top":  50,   # Y do topo (chute inicial)
    "left": 1650, # X da esquerda
    "width": 250,
    "height": 250
}

def main():
    print("📸 Capturando minimapa em 3 segundos...")
    time.sleep(3)

    with mss() as sct:
        img = np.array(sct.grab(MINIMAP_REGION))

    # Salva a imagem para analisarmos
    cv2.imwrite("minimap_debug.png", img)
    print("✅ Arquivo salvo como minimap_debug.png")

if __name__ == "__main__":
    main()

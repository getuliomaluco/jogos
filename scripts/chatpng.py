import time
from mss import mss
import cv2
import numpy as np

CHAT_REGION = {
    "top": 909,
    "left": 1,
    "width": 1561,
    "height": 112
}

with mss() as sct:
    img = np.array(sct.grab(CHAT_REGION))
    cv2.imwrite("chat_test.png", img)
    print("Screenshot salva como chat_test.png")

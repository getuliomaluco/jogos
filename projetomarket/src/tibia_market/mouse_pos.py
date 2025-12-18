from pynput import mouse

def on_move(x, y):
    print(f"x={x}, y={y}")

mouse.Listener(on_move=on_move).start()

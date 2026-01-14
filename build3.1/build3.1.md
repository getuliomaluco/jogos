# build3.1 reference

Project: remote screen capture + input macros (Windows client + Linux server).

Paths:
- Windows client (source): E:\remote-client
- Linux server (source): \\192.168.0.104\getulio\build3.1
- Repo: build3.1/client and build3.1/server

Quick summary:
- Client is a static web UI that connects via WebSocket to the Linux server, shows the screen stream, and sends input/macros.
- Server is Python (server.py) using websockets + mss + Pillow to capture the screen, encode JPEG base64, and send frames.
- Input execution uses xdotool for mouse/keyboard/text/scroll; systemd service file provided.

Sync from repo (Windows):
- powershell -ExecutionPolicy Bypass -File build3.1\setup.ps1

Server run (Linux):
- Install deps: bash /home/getulio/build3.1/install.sh
- Run: python3 /home/getulio/build3.1/server.py --port 8888 --verbose
- Systemd: remote-control.service (DISPLAY=:0, XAUTHORITY=/home/getulio/.Xauthority)

Client run (Windows):
- Open build3.1/client/index.html in a browser
- Enter Linux IP and port (default 8888), connect

Notes on macros:
- Macro editor supports delay (fixed/random), key press/down/up, mouse click/down/up, scroll, and move (abs/rel).
- Recording from the preview canvas supports keystrokes, clicks, and moves with optional press duration.

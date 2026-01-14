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
- Analyzer (Windows) uses OpenCV template matching against assets/minimap/images.

Sync from repo (Windows):
- powershell -ExecutionPolicy Bypass -File build3.1\setup.ps1

Analyzer (Windows):
- pip install -r build3.1\analyzer\requirements.txt
- python build3.1\analyzer\analyze_server.py
- Analyzer URL: http://127.0.0.1:5005/analyze

Config (Linux systemd):
- build3.1/config.env (copied to /home/getulio/build3.1/config.env)
- systemd script: /home/getulio/build3.1/server/setup_systemd.sh

Server run (Linux):
- Install deps: bash /home/getulio/build3.1/install.sh
- Run: python3 /home/getulio/build3.1/server.py --port 8888 --verbose
- Systemd: remote-control.service

Client run (Windows):
- Open build3.1/client/index.html in a browser
- Enter Linux IP and port (default 8888), connect

Notes on macros:
- Macro editor supports delay (fixed/random), key press/down/up, mouse click/down/up, scroll, and move (abs/rel).
- Recording from the preview canvas supports keystrokes, clicks, and moves with optional press duration.

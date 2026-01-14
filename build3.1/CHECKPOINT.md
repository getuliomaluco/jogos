# build3.1 project checkpoint

This file is a portable summary + quickstart for the build3.1 project.
Use it to resume work in a new session without re-discovery.

## Repo + paths
- Repo: C:\Users\Getul\Documents\jogos (GitHub: https://github.com/getuliomaluco/jogos)
- Project root: build3.1
- Windows client working dir: E:\remote-client
- Linux server path (share): \\192.168.0.104\getulio\build3.1
- Linux server path (local): /home/getulio/build3.1

## Architecture
- Client: static web UI (index.html/app.js/style.css) connects to Linux WebSocket server.
- Server: Python (websockets, mss, Pillow) streams screen as JPEG base64 and executes inputs via xdotool.
- Analyzer: Windows local Flask service using OpenCV template matching on ROI images.

## Quick start (Windows)
1) Sync repo -> working folders:
   powershell -ExecutionPolicy Bypass -File build3.1\setup.ps1
2) Start analyzer:
   pip install -r build3.1\analyzer\requirements.txt
   python build3.1\analyzer\analyze_server.py
3) Open client:
   E:\remote-client\index.html
   Set Analyzer URL: http://127.0.0.1:5005/analyze

## Quick start (Linux)
1) Install deps:
   bash /home/getulio/build3.1/install.sh
2) Run server:
   python3 /home/getulio/build3.1/server.py --port 8888 --verbose
3) systemd:
   bash /home/getulio/build3.1/server/setup_systemd.sh
   bash /home/getulio/build3.1/server/setup_systemd.sh --restart

## Checklist (deploy/validation)

### Sync
- Run: powershell -ExecutionPolicy Bypass -File build3.1\\setup.ps1
- Confirm files in E:\\remote-client and \\\\192.168.0.104\\getulio\\build3.1

### Linux deps
- bash /home/getulio/build3.1/install.sh
- Verify: python3 -c \"import websockets, mss, PIL\" (no error)
- Verify: xdotool --version

### Systemd
- Review /home/getulio/build3.1/config.env
- bash /home/getulio/build3.1/server/setup_systemd.sh
- bash /home/getulio/build3.1/server/setup_systemd.sh --restart
- systemctl status remote-control.service

### Client
- Open build3.1/client/index.html
- Connect to ws://<linux-ip>:8888
- Confirm FPS updates and latency
- Start analyzer: python build3.1\\analyzer\\analyze_server.py
- Set Analyzer URL to http://127.0.0.1:5005/analyze

### Input
- Click on the preview and confirm mouse click on Linux
- Type in the text box and send
- Try a macro with delay + click
- Try a macro with vision step (match/miss)

### Troubleshooting
- Check logs: ~/.local/share/remote-control/server.log
- Confirm DISPLAY and XAUTHORITY in config.env
- Ensure port 8888 is open and reachable

## UI features (current)
- Stream canvas + 2 ROI previews (ROI 1 and ROI 2) to the right.
- ROI previews auto-scale and forward clicks to the remote host.
- Macro editor with events: delay, key, mouse, scroll, move, vision.
- Vision event supports onMatch/onMiss actions (continue/jump/stop).
- Test vision button in UI.
- Quick buttons: Delay 3-5s, Delay 5-8s, F1/F2/F3, 1/2/3, LadderUp (2x click at 728,343),
  MagicRope (Home), Shovel (custom key default End -> delay 100-200ms -> click 728,343).
- Duplicate macro button.
- Restart service button (sends WS command to server).

## ROI defaults
- ROI 1: x1=1748 y1=37 x2=1860 y2=154 (top-right minimap area)
- ROI 2: x1=1569 y1=182 x2=1736 y2=300

## Analyzer details
- Service: build3.1/analyzer/analyze_server.py
- Templates: build3.1/assets/minimap/images
- Label: minimapopencv
- /health endpoint should return labels.
- Template matching resizes templates when ROI is smaller (fix for score 0.00).

## Service restart (Linux)
- WebSocket command: {"type":"service","action":"restart"}
- Sudoers set in /etc/sudoers.d/remote-control:
  getulio ALL=(root) NOPASSWD: /bin/systemctl restart remote-control.service

## What worked
- Repo sync and GitHub commits/pushes.
- ROI previews and click forwarding.
- Analyzer health endpoint and label detection.
- Systemd service restart via SSH and sudoers rule.
- Web UI macro shortcuts and vision flow.

## What failed / pitfalls
- WebSocket test via Python timed out when the server wasn?t reachable from Windows (handshake timeout).
- Vision test returned 0.00 initially because ROI was smaller than 256x256 templates.
- Robocopy failed with UNC path when default had extra backslashes; fixed in setup.ps1.
- Plink SSH failed initially due to host key not cached; used -hostkey.

## Known fixes applied
- Analyzer now resizes templates when ROI is smaller.
- setup.ps1 default UNC path fixed.
- systemd setup script supports --restart.
- ROI inputs clamp to target size.

## Next steps ideas
- Add ROI overlay rectangles on main canvas.
- Add ?vision test? result details (score + template name).
- Add ROI selector for vision events (ROI 1 vs ROI 2).
- Add better macro search/filter and export/import.


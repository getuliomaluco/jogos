# build3.1 deploy/validation checklist

## Sync
- Run: powershell -ExecutionPolicy Bypass -File build3.1\setup.ps1
- Confirm files in E:\remote-client and \\192.168.0.104\getulio\build3.1

## Linux deps
- bash /home/getulio/build3.1/install.sh
- Verify: python3 -c "import websockets, mss, PIL" (no error)
- Verify: xdotool --version

## Systemd
- Review /home/getulio/build3.1/config.env
- chmod +x /home/getulio/build3.1/server/setup_systemd.sh
- bash /home/getulio/build3.1/server/setup_systemd.sh
- bash /home/getulio/build3.1/server/setup_systemd.sh --restart
- systemctl status remote-control.service

## Manual run (fallback)
- python3 /home/getulio/build3.1/server.py --port 8888 --verbose

## Client
- Open build3.1/client/index.html
- Connect to ws://<linux-ip>:8888
- Confirm FPS updates and latency

## Input
- Click on the preview and confirm mouse click on Linux
- Type in the text box and send
- Try a macro with delay + click

## Troubleshooting
- Check logs: ~/.local/share/remote-control/server.log
- Confirm DISPLAY and XAUTHORITY in config.env
- Ensure port 8888 is open and reachable

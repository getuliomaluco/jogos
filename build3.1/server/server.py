#!/usr/bin/env python3
import argparse
import asyncio
import base64
import json
import logging
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass
from typing import Optional, Set, Dict, Any

import websockets
from websockets.server import WebSocketServerProtocol

# ---- Optional deps (installed via install.sh) ----
try:
    import mss
except ImportError:
    mss = None

try:
    from PIL import Image
except ImportError:
    Image = None


APP_NAME = "remote-control"
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8080

TARGET_W = 1920
TARGET_H = 1080
DEFAULT_INTERVAL_MS = 200          # 5 FPS
DEFAULT_JPEG_QUALITY = 70          # good tradeoff


def now_ms() -> int:
    return int(time.time() * 1000)


def ensure_dirs(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def setup_logger(log_dir: str, verbose: bool) -> logging.Logger:
    ensure_dirs(log_dir)
    log_path = os.path.join(log_dir, "server.log")

    logger = logging.getLogger(APP_NAME)
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)

    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

    fh = logging.FileHandler(log_path, encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.DEBUG if verbose else logging.INFO)
    sh.setFormatter(fmt)
    logger.addHandler(sh)

    logger.info("Log em: %s", log_path)
    return logger


def check_runtime_deps(logger: logging.Logger) -> None:
    missing = []
    if mss is None:
        missing.append("mss")
    if Image is None:
        missing.append("Pillow (PIL)")

    if missing:
        logger.error("Dependências Python faltando: %s", ", ".join(missing))
        logger.error("Rode: bash /home/getulio/build3.1/install.sh")
        sys.exit(1)


def have_xdotool() -> bool:
    return subprocess.call(["bash", "-lc", "command -v xdotool >/dev/null 2>&1"]) == 0


def clamp_int(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


@dataclass
class Frame:
    ts_ms: int
    w: int
    h: int
    fmt: str
    b64: str


class FrameProducer:
    def __init__(self, logger: logging.Logger, interval_ms: int, jpeg_quality: int):
        self.logger = logger
        self.interval_ms = clamp_int(interval_ms, 50, 2000)
        self.jpeg_quality = clamp_int(jpeg_quality, 20, 95)
        self._latest: Optional[Frame] = None
        self._event = asyncio.Event()
        self._stop = asyncio.Event()

        self._fps_counter = 0
        self._fps_last_ts = time.time()
        self.fps = 0.0

    @property
    def latest(self) -> Optional[Frame]:
        return self._latest

    def set_interval_ms(self, v: int) -> None:
        self.interval_ms = clamp_int(v, 50, 2000)

    def set_jpeg_quality(self, v: int) -> None:
        self.jpeg_quality = clamp_int(v, 20, 95)

    def stop(self) -> None:
        self._stop.set()
        self._event.set()

    async def wait_new(self) -> None:
        await self._event.wait()
        self._event.clear()

    async def run(self) -> None:
        """
        Captura a tela em loop e publica o frame mais recente.
        """
        check_runtime_deps(self.logger)

        with mss.mss() as sct:
            # Monitor 1 normalmente é a tela inteira
            monitor = sct.monitors[1]
            self.logger.info("Captura monitor: %s", monitor)

            # Para garantir 1920x1080, capturamos FULL e redimensionamos caso necessário.
            # (mss captura na resolução real atual; se for diferente, ajustamos para TARGET_W/H)
            while not self._stop.is_set():
                t0 = time.time()
                try:
                    shot = sct.grab(monitor)  # BGRA
                    img = Image.frombytes("RGB", shot.size, shot.rgb)

                    if img.size != (TARGET_W, TARGET_H):
                        img = img.resize((TARGET_W, TARGET_H))

                    # JPEG encode in-memory
                    import io
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=self.jpeg_quality, optimize=True)
                    b64 = base64.b64encode(buf.getvalue()).decode("ascii")

                    self._latest = Frame(
                        ts_ms=now_ms(),
                        w=TARGET_W,
                        h=TARGET_H,
                        fmt="jpeg",
                        b64=b64,
                    )
                    self._event.set()

                    # FPS server-side
                    self._fps_counter += 1
                    t1 = time.time()
                    if (t1 - self._fps_last_ts) >= 1.0:
                        self.fps = self._fps_counter / (t1 - self._fps_last_ts)
                        self._fps_counter = 0
                        self._fps_last_ts = t1

                except Exception as e:
                    self.logger.exception("Erro capturando tela: %s", e)

                # pacing
                elapsed_ms = (time.time() - t0) * 1000
                sleep_ms = max(0, self.interval_ms - elapsed_ms)
                await asyncio.sleep(sleep_ms / 1000.0)


class InputExecutor:
    """
    Executor simples via xdotool.
    (Sem autenticação pois é LAN /24 e requisito do projeto)
    """
    def __init__(self, logger: logging.Logger):
        self.logger = logger
        self._xdotool_ok = have_xdotool()
        if not self._xdotool_ok:
            self.logger.warning("xdotool não encontrado. Comandos de input ficarão indisponíveis.")

    def _run(self, cmd: str) -> None:
        if not self._xdotool_ok:
            raise RuntimeError("xdotool não instalado")

        # DISPLAY e XAUTHORITY precisam estar corretos quando rodando como serviço
        env = os.environ.copy()
        env.setdefault("DISPLAY", ":0")
        # XAUTHORITY pode variar; no systemd setamos explicitamente, mas aqui deixamos fallback
        env.setdefault("XAUTHORITY", os.path.expanduser("~/.Xauthority"))

        # Executa via bash -lc para suportar strings com quotes com mais facilidade
        r = subprocess.run(["bash", "-lc", cmd], env=env, capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"Falha xdotool: {r.stderr.strip() or r.stdout.strip() or 'erro desconhecido'}")

    def mouse_click(self, x: int, y: int, button: int) -> None:
        x = clamp_int(int(x), 0, TARGET_W)
        y = clamp_int(int(y), 0, TARGET_H)
        button = clamp_int(int(button), 1, 7)
        self._run(f"xdotool mousemove {x} {y} click {button}")

    def mouse_down(self, x: int, y: int, button: int) -> None:
        x = clamp_int(int(x), 0, TARGET_W)
        y = clamp_int(int(y), 0, TARGET_H)
        button = clamp_int(int(button), 1, 7)
        self._run(f"xdotool mousemove {x} {y} mousedown {button}")

    def mouse_up(self, x: int, y: int, button: int) -> None:
        x = clamp_int(int(x), 0, TARGET_W)
        y = clamp_int(int(y), 0, TARGET_H)
        button = clamp_int(int(button), 1, 7)
        self._run(f"xdotool mousemove {x} {y} mouseup {button}")

    def mouse_move(self, x: int, y: int) -> None:
        x = clamp_int(int(x), 0, TARGET_W)
        y = clamp_int(int(y), 0, TARGET_H)
        self._run(f"xdotool mousemove {x} {y}")

    def mouse_move_rel(self, dx: int, dy: int) -> None:
        dx = clamp_int(int(dx), -TARGET_W, TARGET_W)
        dy = clamp_int(int(dy), -TARGET_H, TARGET_H)
        self._run(f"xdotool mousemove_relative -- {dx} {dy}")

    def key(self, key_combo: str) -> None:
        # Ex: "ctrl+c", "Alt+Tab" (no xdotool: alt+Tab)
        kc = str(key_combo).strip()
        if not kc:
            return
        self._run(f"xdotool key --clearmodifiers {sh_quote(kc)}")

    def key_down(self, key_combo: str) -> None:
        kc = str(key_combo).strip()
        if not kc:
            return
        self._run(f"xdotool keydown --clearmodifiers {sh_quote(kc)}")

    def key_up(self, key_combo: str) -> None:
        kc = str(key_combo).strip()
        if not kc:
            return
        self._run(f"xdotool keyup --clearmodifiers {sh_quote(kc)}")

    def text(self, text: str) -> None:
        t = str(text)
        if not t:
            return
        self._run(f"xdotool type --delay 1 --clearmodifiers {sh_quote(t)}")

    def scroll(self, direction: str, x: int, y: int, clicks: int) -> None:
        """
        direction: "up" or "down"
        clicks: quantas 'rolagens' (cada click é uma unidade no xdotool)
        """
        x = clamp_int(int(x), 0, TARGET_W)
        y = clamp_int(int(y), 0, TARGET_H)
        clicks = clamp_int(int(clicks), 1, 50)

        # xdotool: 4 = up, 5 = down
        btn = 4 if direction == "up" else 5
        self._run(f"xdotool mousemove {x} {y} click --repeat {clicks} {btn}")


def sh_quote(s: str) -> str:
    # quoting simples para bash
    return "'" + s.replace("'", "'\"'\"'") + "'"


class RemoteServer:
    def __init__(self, logger: logging.Logger, producer: FrameProducer):
        self.logger = logger
        self.producer = producer
        self.clients: Set[WebSocketServerProtocol] = set()
        self.client_state: Dict[WebSocketServerProtocol, Dict[str, Any]] = {}
        self.inputs = InputExecutor(logger)

    async def send_json(self, ws: WebSocketServerProtocol, obj: Dict[str, Any]) -> None:
        await ws.send(json.dumps(obj, ensure_ascii=False))

    async def broadcast_stats_loop(self):
        while True:
            await asyncio.sleep(1.0)
            if not self.clients:
                continue
            payload = {"type": "stats", "server_fps": round(self.producer.fps, 2), "ts": now_ms()}
            dead = []
            for ws in list(self.clients):
                try:
                    await self.send_json(ws, payload)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                await self._drop(ws)

    async def _drop(self, ws: WebSocketServerProtocol):
        if ws in self.clients:
            self.clients.remove(ws)
        self.client_state.pop(ws, None)

    async def handler(self, ws: WebSocketServerProtocol):
        self.clients.add(ws)
        self.client_state[ws] = {"paused": False}
        self.logger.info("Cliente conectado: %s", ws.remote_address)

        # Mensagem inicial (handshake)
        await self.send_json(ws, {
            "type": "hello",
            "target_w": TARGET_W,
            "target_h": TARGET_H,
            "interval_ms": self.producer.interval_ms,
            "jpeg_quality": self.producer.jpeg_quality,
            "ts": now_ms(),
        })

        sender_task = asyncio.create_task(self._sender_loop(ws))
        try:
            async for msg in ws:
                await self._handle_message(ws, msg)
        except websockets.ConnectionClosed:
            pass
        except Exception as e:
            self.logger.exception("Erro no cliente: %s", e)
        finally:
            sender_task.cancel()
            await self._drop(ws)
            self.logger.info("Cliente desconectado: %s", ws.remote_address)

    async def _sender_loop(self, ws: WebSocketServerProtocol):
        """
        Envia frames novos para o cliente quando disponíveis.
        """
        while True:
            await self.producer.wait_new()

            st = self.client_state.get(ws, {})
            if st.get("paused"):
                continue

            fr = self.producer.latest
            if not fr:
                continue

            payload = {
                "type": "frame",
                "ts": fr.ts_ms,
                "w": fr.w,
                "h": fr.h,
                "format": fr.fmt,
                "data": fr.b64
            }
            try:
                await self.send_json(ws, payload)
            except Exception:
                return

    async def _handle_message(self, ws: WebSocketServerProtocol, msg: str):
        try:
            obj = json.loads(msg)
        except Exception:
            return

        t = obj.get("type")

        # --- ping/pong para latência no cliente ---
        if t == "ping":
            # devolve o mesmo ts do cliente se existir
            await self.send_json(ws, {"type": "pong", "ts": obj.get("ts"), "server_ts": now_ms()})
            return

        # --- controle de stream por cliente ---
        if t == "stream":
            action = obj.get("action")
            if action == "pause":
                self.client_state[ws]["paused"] = True
                await self.send_json(ws, {"type": "stream", "status": "paused", "ts": now_ms()})
            elif action == "resume":
                self.client_state[ws]["paused"] = False
                await self.send_json(ws, {"type": "stream", "status": "running", "ts": now_ms()})
            return

        # --- ajustes globais de captura (opcional) ---
        if t == "set":
            # cuidado: afeta todos clientes
            if "interval_ms" in obj:
                self.producer.set_interval_ms(int(obj["interval_ms"]))
            if "jpeg_quality" in obj:
                self.producer.set_jpeg_quality(int(obj["jpeg_quality"]))
            await self.send_json(ws, {
                "type": "set",
                "interval_ms": self.producer.interval_ms,
                "jpeg_quality": self.producer.jpeg_quality,
                "ts": now_ms()
            })
            return

        # --- controle do servico (reinicio) ---
        if t == "service":
            action = obj.get("action")
            if action == "restart":
                try:
                    r = subprocess.run(
                        ["systemctl", "restart", "remote-control.service"],
                        capture_output=True,
                        text=True,
                        timeout=10,
                    )
                    if r.returncode != 0:
                        raise RuntimeError(r.stderr.strip() or r.stdout.strip() or "systemctl failed")
                    await self.send_json(ws, {"type": "service", "status": "restarted", "ts": now_ms()})
                except Exception as e:
                    await self.send_json(ws, {"type": "error", "message": str(e), "ts": now_ms()})
            return

        # --- INPUT (base pronta) ---
        if t == "input":
            ev = obj.get("event")
            try:
                if ev == "mouse_click":
                    self.inputs.mouse_click(obj["x"], obj["y"], obj.get("button", 1))
                elif ev == "mouse_down":
                    self.inputs.mouse_down(obj["x"], obj["y"], obj.get("button", 1))
                elif ev == "mouse_up":
                    self.inputs.mouse_up(obj["x"], obj["y"], obj.get("button", 1))
                elif ev == "mouse_move":
                    self.inputs.mouse_move(obj["x"], obj["y"])
                elif ev == "mouse_move_rel":
                    self.inputs.mouse_move_rel(obj["x"], obj["y"])
                elif ev == "scroll":
                    self.inputs.scroll(obj.get("direction", "down"), obj["x"], obj["y"], obj.get("clicks", 1))
                elif ev == "key":
                    self.inputs.key(obj.get("key", ""))
                elif ev == "key_down":
                    self.inputs.key_down(obj.get("key", ""))
                elif ev == "key_up":
                    self.inputs.key_up(obj.get("key", ""))
                elif ev == "text":
                    self.inputs.text(obj.get("text", ""))
                else:
                    raise ValueError("evento input desconhecido")
                await self.send_json(ws, {"type": "ok", "event": ev, "ts": now_ms()})
            except Exception as e:
                await self.send_json(ws, {"type": "error", "event": ev, "message": str(e), "ts": now_ms()})
            return

        # fallback
        await self.send_json(ws, {"type": "error", "message": "tipo desconhecido", "ts": now_ms()})


async def main():
    parser = argparse.ArgumentParser(description="Remote Control Server (WebSocket) - Linux Mint")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--interval-ms", type=int, default=DEFAULT_INTERVAL_MS)
    parser.add_argument("--jpeg-quality", type=int, default=DEFAULT_JPEG_QUALITY)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    log_dir = os.path.expanduser("~/.local/share/remote-control")
    logger = setup_logger(log_dir, args.verbose)

    producer = FrameProducer(logger, args.interval_ms, args.jpeg_quality)
    server = RemoteServer(logger, producer)

    loop = asyncio.get_running_loop()
    stop_event = asyncio.Event()

    def _sig(*_):
        logger.info("Sinal de parada recebido. Encerrando...")
        producer.stop()
        stop_event.set()

    for s in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(s, _sig)
        except NotImplementedError:
            pass

    # Start capture task
    capture_task = asyncio.create_task(producer.run())
    stats_task = asyncio.create_task(server.broadcast_stats_loop())

    # Bind WebSocket server (porta livre)
    try:
        ws_server = await websockets.serve(server.handler, args.host, args.port, max_size=25 * 1024 * 1024)
    except OSError as e:
        logger.error("Não foi possível iniciar na porta %s:%d -> %s", args.host, args.port, e)
        logger.error("Tente outra porta: 8080, 8888, 9000, etc.")
        producer.stop()
        capture_task.cancel()
        stats_task.cancel()
        return

    logger.info("WebSocket OK em ws://%s:%d", args.host, args.port)

    await stop_event.wait()

    ws_server.close()
    await ws_server.wait_closed()
    capture_task.cancel()
    stats_task.cancel()
    logger.info("Servidor finalizado.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass

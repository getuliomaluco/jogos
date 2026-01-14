/* =====================================================
   CLIENTE REMOTE CONTROL - APP.JS
===================================================== */

function log(...args) {
  console.log("[CLIENT]", ...args);
}
function logError(...args) {
  console.error("[CLIENT][ERROR]", ...args);
}

let ws = null;
let manualClose = false;
let pingTimer = null;
let reconnectTimer = null;
let reconnectDelay = 1000;

let targetW = 1920;
let targetH = 1080;

const ip = document.getElementById("ip");
const port = document.getElementById("port");
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const emergencyStopBtn = document.getElementById("emergencyStop");
const restartServiceBtn = document.getElementById("restartService");
const connStatus = document.getElementById("connStatus");
const latency = document.getElementById("latency");
const fps = document.getElementById("fps");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const roiCanvas = document.getElementById("roiCanvas");
const roiCtx = roiCanvas.getContext("2d");
const roiX1 = document.getElementById("roiX1");
const roiY1 = document.getElementById("roiY1");
const roiX2 = document.getElementById("roiX2");
const roiY2 = document.getElementById("roiY2");
const roi2Canvas = document.getElementById("roi2Canvas");
const roi2Ctx = roi2Canvas.getContext("2d");
const roi2X1 = document.getElementById("roi2X1");
const roi2Y1 = document.getElementById("roi2Y1");
const roi2X2 = document.getElementById("roi2X2");
const roi2Y2 = document.getElementById("roi2Y2");
const hoverX = document.getElementById("hoverX");
const hoverY = document.getElementById("hoverY");
const clickMarker = document.getElementById("clickMarker");

const pauseStreamBtn = document.getElementById("pauseStream");
const resumeStreamBtn = document.getElementById("resumeStream");
const captureKeyboard = document.getElementById("captureKeyboard");
const textInput = document.getElementById("textInput");
const sendTextBtn = document.getElementById("sendText");
const keyButtons = document.getElementById("keyButtons");

const newMacroBtn = document.getElementById("newMacro");
const deleteMacroBtn = document.getElementById("deleteMacro");
const duplicateMacroBtn = document.getElementById("duplicateMacro");
const macroList = document.getElementById("macroList");
const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const playMacroBtn = document.getElementById("playMacroBtn");
const addDelayBtn = document.getElementById("addDelayBtn");
const addDelayValue = document.getElementById("addDelayValue");
const addDelay35Btn = document.getElementById("addDelay35Btn");
const addKeyBtn = document.getElementById("addKeyBtn");
const addF1Btn = document.getElementById("addF1Btn");
const addF2Btn = document.getElementById("addF2Btn");
const addF3Btn = document.getElementById("addF3Btn");
const addKey1Btn = document.getElementById("addKey1Btn");
const addKey2Btn = document.getElementById("addKey2Btn");
const addKey3Btn = document.getElementById("addKey3Btn");
const addClickLeftBtn = document.getElementById("addClickLeftBtn");
const addClickRightBtn = document.getElementById("addClickRightBtn");
const addScrollBtn = document.getElementById("addScrollBtn");
const addVisionBtn = document.getElementById("addVisionBtn");
const moveUpBtn = document.getElementById("moveUpBtn");
const moveDownBtn = document.getElementById("moveDownBtn");
const removeActionBtn = document.getElementById("removeActionBtn");
const stopAllMacrosBtn = document.getElementById("stopAllMacros");
const macroName = document.getElementById("macroName");
const macroLoop = document.getElementById("macroLoop");
const macroLoopCount = document.getElementById("macroLoopCount");
const saveMacroBtn = document.getElementById("saveMacro");
const eventList = document.getElementById("eventList");

const eventEditorHint = document.getElementById("eventEditorHint");
const eventEditor = document.getElementById("eventEditor");
const eventType = document.getElementById("eventType");
const delayType = document.getElementById("delayType");
const delayValue = document.getElementById("delayValue");
const delayMin = document.getElementById("delayMin");
const delayMax = document.getElementById("delayMax");
const delayFixedFields = document.getElementById("delayFixedFields");
const delayRandomFields = document.getElementById("delayRandomFields");
const keyAction = document.getElementById("keyAction");
const keyValue = document.getElementById("keyValue");
const mouseAction = document.getElementById("mouseAction");
const mouseButton = document.getElementById("mouseButton");
const mouseX = document.getElementById("mouseX");
const mouseY = document.getElementById("mouseY");
const scrollDirection = document.getElementById("scrollDirection");
const scrollClicks = document.getElementById("scrollClicks");
const scrollX = document.getElementById("scrollX");
const scrollY = document.getElementById("scrollY");
const moveMode = document.getElementById("moveMode");
const moveX = document.getElementById("moveX");
const moveY = document.getElementById("moveY");
const captureCoordsBtn = document.getElementById("captureCoords");
const captureStatus = document.getElementById("captureStatus");
const saveEventBtn = document.getElementById("saveEvent");
const newEventBtn = document.getElementById("newEvent");
const cursorTooltip = document.getElementById("cursorTooltip");
const analyzerUrl = document.getElementById("analyzerUrl");
const testVisionBtn = document.getElementById("testVisionBtn");
const testVisionStatus = document.getElementById("testVisionStatus");

const recKeys = document.getElementById("recKeys");
const recClicks = document.getElementById("recClicks");
const recAbsMove = document.getElementById("recAbsMove");
const recRelMove = document.getElementById("recRelMove");
const recPressDuration = document.getElementById("recPressDuration");

const visionLabel = document.getElementById("visionLabel");
const visionThreshold = document.getElementById("visionThreshold");
const visionOnMatch = document.getElementById("visionOnMatch");
const visionOnMiss = document.getElementById("visionOnMiss");
const visionJumpMatch = document.getElementById("visionJumpMatch");
const visionJumpMiss = document.getElementById("visionJumpMiss");
const visionRoiX1 = document.getElementById("visionRoiX1");
const visionRoiY1 = document.getElementById("visionRoiY1");
const visionRoiX2 = document.getElementById("visionRoiX2");
const visionRoiY2 = document.getElementById("visionRoiY2");
const visionUseRoi = document.getElementById("visionUseRoi");

ip.value = localStorage.getItem("linux_ip") || "";
analyzerUrl.value = localStorage.getItem("analyzer_url") || "http://127.0.0.1:5005/analyze";

const DEFAULT_ROI = { x1: 1748, y1: 37, x2: 1860, y2: 154 };
let roi = { ...DEFAULT_ROI };
const storedRoi = localStorage.getItem("roi_coords");
if (storedRoi) {
  try {
    const parsed = JSON.parse(storedRoi);
    if (parsed && Number.isFinite(parsed.x1)) {
      roi = parsed;
    }
  } catch {
    roi = { ...DEFAULT_ROI };
  }
}

roiX1.value = roi.x1;
roiY1.value = roi.y1;
roiX2.value = roi.x2;
roiY2.value = roi.y2;

const DEFAULT_ROI2 = { x1: 1569, y1: 182, x2: 1736, y2: 300 };
let roi2 = { ...DEFAULT_ROI2 };
const storedRoi2 = localStorage.getItem("roi2_coords");
if (storedRoi2) {
  try {
    const parsed = JSON.parse(storedRoi2);
    if (parsed && Number.isFinite(parsed.x1)) {
      roi2 = parsed;
    }
  } catch {
    roi2 = { ...DEFAULT_ROI2 };
  }
}

roi2X1.value = roi2.x1;
roi2Y1.value = roi2.y1;
roi2X2.value = roi2.x2;
roi2Y2.value = roi2.y2;

function setConnectionUi(connected) {
  connStatus.textContent = connected ? "Conectado" : "Desconectado";
  connectBtn.disabled = connected;
  disconnectBtn.disabled = !connected;
}

function setRoiFromInputs() {
  roi.x1 = Number(roiX1.value || 0);
  roi.y1 = Number(roiY1.value || 0);
  roi.x2 = Number(roiX2.value || 0);
  roi.y2 = Number(roiY2.value || 0);
  clampRoiToTarget();
  roiX1.value = roi.x1;
  roiY1.value = roi.y1;
  roiX2.value = roi.x2;
  roiY2.value = roi.y2;
  localStorage.setItem("roi_coords", JSON.stringify(roi));
  renderRoiPreview();
}

function clampRoiToTarget() {
  roi.x1 = Math.max(0, Math.min(targetW, roi.x1));
  roi.y1 = Math.max(0, Math.min(targetH, roi.y1));
  roi.x2 = Math.max(0, Math.min(targetW, roi.x2));
  roi.y2 = Math.max(0, Math.min(targetH, roi.y2));
}

function setRoi2FromInputs() {
  roi2.x1 = Number(roi2X1.value || 0);
  roi2.y1 = Number(roi2Y1.value || 0);
  roi2.x2 = Number(roi2X2.value || 0);
  roi2.y2 = Number(roi2Y2.value || 0);
  clampRoi2ToTarget();
  roi2X1.value = roi2.x1;
  roi2Y1.value = roi2.y1;
  roi2X2.value = roi2.x2;
  roi2Y2.value = roi2.y2;
  localStorage.setItem("roi2_coords", JSON.stringify(roi2));
  renderRoi2Preview();
}

function clampRoi2ToTarget() {
  roi2.x1 = Math.max(0, Math.min(targetW, roi2.x1));
  roi2.y1 = Math.max(0, Math.min(targetH, roi2.y1));
  roi2.x2 = Math.max(0, Math.min(targetW, roi2.x2));
  roi2.y2 = Math.max(0, Math.min(targetH, roi2.y2));
}

function startPing() {
  stopPing();
  pingTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
    }
  }, 1000);
}

function stopPing() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
  }
}

function scheduleReconnect() {
  if (manualClose) return;
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(true);
    reconnectDelay = Math.min(reconnectDelay * 2, 10000);
  }, reconnectDelay);
}

function connect(isReconnect) {
  if (!ip.value) {
    alert("Informe o IP do Linux");
    return;
  }

  manualClose = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  localStorage.setItem("linux_ip", ip.value);
  const url = `ws://${ip.value}:${port.value}`;
  log("Tentando conectar em", url);

  ws = new WebSocket(url);

  ws.onopen = () => {
    log("WebSocket conectado");
    setConnectionUi(true);
    reconnectDelay = 1000;
    startPing();
    if (isReconnect) {
      log("Reconectado");
    }
  };

  ws.onclose = (e) => {
    log("WebSocket fechado", e.code, e.reason);
    setConnectionUi(false);
    stopPing();
    scheduleReconnect();
  };

  ws.onerror = (e) => {
    logError("Erro WebSocket", e);
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);

      if (msg.type === "hello") {
        if (Number.isFinite(msg.target_w)) targetW = msg.target_w;
        if (Number.isFinite(msg.target_h)) targetH = msg.target_h;
        clampRoiToTarget();
        clampRoi2ToTarget();
        roiX1.value = roi.x1;
        roiY1.value = roi.y1;
        roiX2.value = roi.x2;
        roiY2.value = roi.y2;
        roi2X1.value = roi2.x1;
        roi2Y1.value = roi2.y1;
        roi2X2.value = roi2.x2;
        roi2Y2.value = roi2.y2;
        renderRoiPreview();
        renderRoi2Preview();
      }

      if (msg.type === "frame") {
        drawFrame(msg.data, msg.format);
      }

      if (msg.type === "pong") {
        latency.textContent = Date.now() - msg.ts;
      }

      if (msg.type === "stats") {
        fps.textContent = msg.server_fps;
      }

      if (msg.type === "error") {
        logError("Erro do servidor:", msg.message);
      }
    } catch (err) {
      logError("Falha ao processar mensagem", err, e.data);
    }
  };
}

connectBtn.onclick = () => connect(false);

disconnectBtn.onclick = () => {
  manualClose = true;
  if (ws) {
    log("Fechando WebSocket manualmente");
    ws.close();
  }
  stopPing();
};

emergencyStopBtn.onclick = () => {
  // Para tudo no cliente: macros, gravacao e conexao
  Object.keys(runningMacros).forEach((id) => {
    runningMacros[id].stop = true;
  });
  stopRecording();
  pendingAddClick = false;
  setCaptureState(false);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
  manualClose = true;
  stopPing();
  renderMacroList();
};

restartServiceBtn.onclick = () => {
  sendInput({ type: "service", action: "restart" });
};

pauseStreamBtn.onclick = () => {
  sendInput({ type: "stream", action: "pause" });
};

resumeStreamBtn.onclick = () => {
  sendInput({ type: "stream", action: "resume" });
};

[roiX1, roiY1, roiX2, roiY2].forEach((el) => {
  el.addEventListener("change", () => {
    setRoiFromInputs();
  });
});

[roi2X1, roi2Y1, roi2X2, roi2Y2].forEach((el) => {
  el.addEventListener("change", () => {
    setRoi2FromInputs();
  });
});

analyzerUrl.addEventListener("change", () => {
  localStorage.setItem("analyzer_url", analyzerUrl.value || "");
});

window.addEventListener("resize", () => {
  renderRoiPreview();
  renderRoi2Preview();
});

testVisionBtn.onclick = async () => {
  testVisionStatus.textContent = "Analisando...";
  const ev = {
    type: "vision",
    label: (visionLabel && visionLabel.value) ? visionLabel.value : "minimapopencv",
    threshold: visionThreshold && visionThreshold.value ? Number(visionThreshold.value) : 0.85,
    roi: { ...roi }
  };
  const result = await analyzeVisionEvent(ev);
  if (result.match) {
    testVisionStatus.textContent = `Match (${result.score.toFixed(2)})`;
  } else {
    testVisionStatus.textContent = `No match (${result.score.toFixed(2)})`;
  }
};

let lastFrameImg = null;

function drawFrame(b64, format) {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    lastFrameImg = img;
    renderRoiPreview();
    renderRoi2Preview();
  };
  const fmt = format || "jpeg";
  img.src = `data:image/${fmt};base64,` + b64;
}

function renderRoiPreview() {
  if (!lastFrameImg) return;
  clampRoiToTarget();
  const w = Math.max(1, roi.x2 - roi.x1);
  const h = Math.max(1, roi.y2 - roi.y1);
  const maxW = Math.max(120, Math.floor(window.innerWidth * 0.25));
  const maxH = Math.max(120, Math.floor(window.innerHeight * 0.3));
  const scale = Math.min(1, maxW / w, maxH / h);
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));
  if (roiCanvas.width !== targetW) roiCanvas.width = targetW;
  if (roiCanvas.height !== targetH) roiCanvas.height = targetH;
  roiCtx.clearRect(0, 0, roiCanvas.width, roiCanvas.height);
  try {
    roiCtx.drawImage(lastFrameImg, roi.x1, roi.y1, w, h, 0, 0, roiCanvas.width, roiCanvas.height);
  } catch {
    // ignore draw errors on fast reconnects
  }
}

function renderRoi2Preview() {
  if (!lastFrameImg) return;
  clampRoi2ToTarget();
  const w = Math.max(1, roi2.x2 - roi2.x1);
  const h = Math.max(1, roi2.y2 - roi2.y1);
  const maxW = Math.max(120, Math.floor(window.innerWidth * 0.25));
  const maxH = Math.max(120, Math.floor(window.innerHeight * 0.3));
  const scale = Math.min(1, maxW / w, maxH / h);
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));
  if (roi2Canvas.width !== targetW) roi2Canvas.width = targetW;
  if (roi2Canvas.height !== targetH) roi2Canvas.height = targetH;
  roi2Ctx.clearRect(0, 0, roi2Canvas.width, roi2Canvas.height);
  try {
    roi2Ctx.drawImage(lastFrameImg, roi2.x1, roi2.y1, w, h, 0, 0, roi2Canvas.width, roi2Canvas.height);
  } catch {
    // ignore draw errors on fast reconnects
  }
}

function sendInput(obj) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log("WS fechado, input ignorado:", obj);
    return;
  }
  ws.send(JSON.stringify(obj));
}

function getCanvasCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.round(((evt.clientX - rect.left) / rect.width) * targetW);
  const y = Math.round(((evt.clientY - rect.top) / rect.height) * targetH);
  return { x, y };
}

let coordCaptureActive = false;
let recording = false;
let lastEventTs = 0;
let lastMoveTs = 0;
let lastMovePos = { x: 0, y: 0 };
let pendingAddClick = null;

function setCaptureState(active) {
  coordCaptureActive = active;
  captureStatus.textContent = active ? "Aguardando clique" : "Inativo";
}

function showClickMarker(x, y) {
  const rect = canvas.getBoundingClientRect();
  const px = (x / targetW) * rect.width;
  const py = (y / targetH) * rect.height;
  clickMarker.style.left = `${px}px`;
  clickMarker.style.top = `${py}px`;
  clickMarker.classList.add("show");
  setTimeout(() => clickMarker.classList.remove("show"), 700);
}

function shouldIgnoreKeyEvent(e) {
  const tag = (e.target && e.target.tagName) || "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
roiCanvas.addEventListener("contextmenu", (e) => e.preventDefault());
roi2Canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getCanvasCoords(e);
  showClickMarker(x, y);
  if (coordCaptureActive && currentMacroId !== null) {
    mouseX.value = x;
    mouseY.value = y;
    scrollX.value = x;
    scrollY.value = y;
    moveX.value = x;
    moveY.value = y;
    setCaptureState(false);
    return;
  }

  if (pendingAddClick) {
    const button = pendingAddClick;
    pendingAddClick = null;
    captureStatus.textContent = "Inativo";
    addEvent({ type: "mouse", action: "click", button, x, y });
    return;
  }

  if (recording && recClicks.checked) {
    recordMouseDown(e, x, y);
    return;
  }

  let button = 1;
  if (e.button === 1) button = 2;
  if (e.button === 2) button = 3;
  sendInput({ type: "input", event: "mouse_click", x, y, button });
});

roiCanvas.addEventListener("mousedown", (e) => {
  if (!lastFrameImg) return;
  const rect = roiCanvas.getBoundingClientRect();
  const w = Math.max(1, roi.x2 - roi.x1);
  const h = Math.max(1, roi.y2 - roi.y1);
  const relX = Math.round(((e.clientX - rect.left) / rect.width) * w);
  const relY = Math.round(((e.clientY - rect.top) / rect.height) * h);
  const x = Math.max(0, Math.min(targetW, roi.x1 + relX));
  const y = Math.max(0, Math.min(targetH, roi.y1 + relY));
  showClickMarker(x, y);

  let button = 1;
  if (e.button === 1) button = 2;
  if (e.button === 2) button = 3;
  sendInput({ type: "input", event: "mouse_click", x, y, button });
});

roi2Canvas.addEventListener("mousedown", (e) => {
  if (!lastFrameImg) return;
  const rect = roi2Canvas.getBoundingClientRect();
  const w = Math.max(1, roi2.x2 - roi2.x1);
  const h = Math.max(1, roi2.y2 - roi2.y1);
  const relX = Math.round(((e.clientX - rect.left) / rect.width) * w);
  const relY = Math.round(((e.clientY - rect.top) / rect.height) * h);
  const x = Math.max(0, Math.min(targetW, roi2.x1 + relX));
  const y = Math.max(0, Math.min(targetH, roi2.y1 + relY));
  showClickMarker(x, y);

  let button = 1;
  if (e.button === 1) button = 2;
  if (e.button === 2) button = 3;
  sendInput({ type: "input", event: "mouse_click", x, y, button });
});

canvas.addEventListener("mouseup", (e) => {
  if (recording && recClicks.checked) {
    const { x, y } = getCanvasCoords(e);
    recordMouseUp(e, x, y);
  }
});

canvas.addEventListener("mousemove", (e) => {
  const hover = getCanvasCoords(e);
  hoverX.textContent = hover.x;
  hoverY.textContent = hover.y;
  const rect = canvas.getBoundingClientRect();
  cursorTooltip.textContent = `X: ${hover.x} Y: ${hover.y}`;
  cursorTooltip.style.left = `${e.clientX - rect.left}px`;
  cursorTooltip.style.top = `${e.clientY - rect.top}px`;
  cursorTooltip.classList.add("show");
  if (!recording) return;
  if (!recAbsMove.checked && !recRelMove.checked) return;
  const now = Date.now();
  if (now - lastMoveTs < 80) return;
  lastMoveTs = now;

  const { x, y } = getCanvasCoords(e);
  if (recAbsMove.checked) {
    recordEvent({ type: "move", mode: "abs", x, y }, now);
  } else if (recRelMove.checked) {
    const dx = x - lastMovePos.x;
    const dy = y - lastMovePos.y;
    if (dx !== 0 || dy !== 0) {
      recordEvent({ type: "move", mode: "rel", x: dx, y: dy }, now);
    }
  }
  lastMovePos = { x, y };
});

canvas.addEventListener("mouseleave", () => {
  hoverX.textContent = "-";
  hoverY.textContent = "-";
  cursorTooltip.classList.remove("show");
});

canvas.addEventListener("wheel", (e) => {
  const { x, y } = getCanvasCoords(e);
  if (recording && recClicks.checked) {
    const direction = e.deltaY < 0 ? "up" : "down";
    const clicks = Math.min(5, Math.max(1, Math.ceil(Math.abs(e.deltaY) / 120)));
    recordEvent({ type: "scroll", direction, clicks, x, y }, Date.now());
    e.preventDefault();
    return;
  }

  const direction = e.deltaY < 0 ? "up" : "down";
  const clicks = Math.min(5, Math.max(1, Math.ceil(Math.abs(e.deltaY) / 120)));
  sendInput({ type: "input", event: "scroll", direction, x, y, clicks });
  e.preventDefault();
});

const SPECIAL_KEY_MAP = {
  Enter: "Return",
  Escape: "Escape",
  Backspace: "BackSpace",
  Delete: "Delete",
  Tab: "Tab",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  ArrowUp: "Up",
  ArrowDown: "Down",
  Home: "Home",
  End: "End",
  PageUp: "Page_Up",
  PageDown: "Page_Down",
  Insert: "Insert",
  " ": "space"
};

function mapKey(key) {
  if (SPECIAL_KEY_MAP[key]) return SPECIAL_KEY_MAP[key];
  if (/^F\d{1,2}$/.test(key)) return key;
  if (key.length === 1) return key.toLowerCase();
  return null;
}

function buildCombo(base, e) {
  const mods = [];
  if (e.ctrlKey) mods.push("ctrl");
  if (e.altKey) mods.push("alt");
  if (e.shiftKey) mods.push("shift");
  if (e.metaKey) mods.push("super");
  if (!mods.length) return base;
  return mods.join("+") + "+" + base;
}

document.addEventListener("keydown", (e) => {
  if (shouldIgnoreKeyEvent(e)) return;

  if (recording && recKeys.checked) {
    if (e.repeat) return;
    const base = mapKey(e.key);
    if (!base) return;

    const combo = buildCombo(base, e);
    if (recPressDuration.checked) {
      recordEvent({ type: "key", action: "down", key: combo }, Date.now());
    } else {
      recordEvent({ type: "key", action: "press", key: combo }, Date.now());
    }
    e.preventDefault();
    return;
  }

  if (!captureKeyboard.checked) return;
  if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;

  const hasCombo = e.ctrlKey || e.altKey || e.metaKey;
  if (!hasCombo && e.key.length === 1) {
    sendInput({ type: "input", event: "text", text: e.key });
    e.preventDefault();
    return;
  }

  const base = mapKey(e.key);
  if (!base) return;
  const combo = buildCombo(base, e);
  sendInput({ type: "input", event: "key", key: combo });
  e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  if (shouldIgnoreKeyEvent(e)) return;
  if (!recording || !recKeys.checked || !recPressDuration.checked) return;

  const base = mapKey(e.key);
  if (!base) return;
  const combo = buildCombo(base, e);
  recordEvent({ type: "key", action: "up", key: combo }, Date.now());
  e.preventDefault();
});

sendTextBtn.onclick = () => {
  const text = textInput.value || "";
  if (!text) return;
  sendInput({ type: "input", event: "text", text });
  textInput.value = "";
};

const keyButtonDefs = [
  { label: "Esc", key: "Escape" },
  { label: "Tab", key: "Tab" },
  { label: "Enter", key: "Return" },
  { label: "Back", key: "BackSpace" },
  { label: "Del", key: "Delete" },
  { label: "Up", key: "Up" },
  { label: "Down", key: "Down" },
  { label: "Left", key: "Left" },
  { label: "Right", key: "Right" }
];

keyButtonDefs.forEach((k) => {
  const btn = document.createElement("button");
  btn.textContent = k.label;
  btn.onclick = () => sendInput({ type: "input", event: "key", key: k.key });
  keyButtons.appendChild(btn);
});

function migrateSequencesToMacros() {
  const raw = localStorage.getItem("sequences");
  if (!raw) return [];
  try {
    const sequences = JSON.parse(raw) || [];
    return sequences.map((seq) => {
      const events = [];
      (seq.actions || []).forEach((action) => {
        if (action.type === "click") {
          events.push({ type: "mouse", action: "click", button: action.button || 1, x: action.x || 0, y: action.y || 0 });
        }
        if (action.type === "key") {
          events.push({ type: "key", action: "press", key: action.key || "" });
        }
        if (action.type === "scroll") {
          events.push({ type: "scroll", direction: action.direction || "down", clicks: action.clicks || 1, x: action.x || 0, y: action.y || 0 });
        }
        if (action.delay) {
          if (action.delay.type === "random") {
            events.push({ type: "delay", mode: "random", min: action.delay.min || 500, max: action.delay.max || 1500 });
          } else {
            events.push({ type: "delay", mode: "fixed", ms: action.delay.value || 1000 });
          }
        }
      });
      return {
        id: seq.id || Date.now(),
        name: seq.name || "Macro",
        loop: !!seq.loop,
        loopCount: seq.loopCount || 0,
        events
      };
    });
  } catch {
    return [];
  }
}

function normalizeMacros(items) {
  items.forEach((macro) => {
    if (!Array.isArray(macro.events)) macro.events = [];
    if (typeof macro.loop !== "boolean") macro.loop = true;
    if (typeof macro.loopCount !== "number") macro.loopCount = 0;
    if (!macro.name) macro.name = "Macro";
  });
}

let macros = [];
const storedMacros = localStorage.getItem("macros");
if (storedMacros) {
  try {
    macros = JSON.parse(storedMacros) || [];
  } catch {
    macros = [];
  }
} else {
  macros = migrateSequencesToMacros();
}
normalizeMacros(macros);

let currentMacroId = macros[0] ? macros[0].id : null;
let selectedEventIndex = null;
let runningMacros = {};

function saveMacros() {
  localStorage.setItem("macros", JSON.stringify(macros));
}

function currentMacro() {
  return macros.find((m) => m.id === currentMacroId) || null;
}

function renderMacroList() {
  macroList.innerHTML = "";
  macros.forEach((m) => {
    const div = document.createElement("div");
    div.className = "list-item" + (m.id === currentMacroId ? " active" : "");
    const title = document.createElement("div");
    title.textContent = `${m.name} (${m.events.length})`;
    const meta = document.createElement("div");
    meta.className = "small";
    meta.textContent = runningMacros[m.id] ? "Rodando" : "Parado";

    const stopBtn = document.createElement("button");
    stopBtn.textContent = "Stop";
    stopBtn.className = "danger";
    stopBtn.disabled = !runningMacros[m.id];
    stopBtn.onclick = (e) => {
      e.stopPropagation();
      stopMacro(m.id);
    };

    div.appendChild(title);
    div.appendChild(meta);
    div.appendChild(stopBtn);
    div.onclick = () => {
      currentMacroId = m.id;
      selectedEventIndex = null;
      renderMacroList();
      renderMacroEditor();
    };
    macroList.appendChild(div);
  });
}

function renderMacroEditor() {
  const macro = currentMacro();
  if (!macro) {
    macroName.value = "";
    macroLoop.checked = false;
    macroLoopCount.value = "";
    eventList.innerHTML = "";
    eventEditor.classList.add("hidden");
    eventEditorHint.classList.remove("hidden");
    return;
  }

  macroName.value = macro.name;
  macroLoop.checked = !!macro.loop;
  macroLoopCount.value = macro.loopCount || 0;

  renderEventList(macro);
  if (selectedEventIndex == null) {
    eventEditor.classList.add("hidden");
    eventEditorHint.classList.remove("hidden");
  }
}

function eventLabel(ev) {
  if (ev.type === "delay") {
    if (ev.mode === "random") return `Delay ${ev.min}-${ev.max} ms`;
    return `Delay ${ev.ms} ms`;
  }
  if (ev.type === "key") {
    return `Key ${ev.action} ${ev.key}`;
  }
  if (ev.type === "mouse") {
    return `Mouse ${ev.action} btn ${ev.button} (${ev.x},${ev.y})`;
  }
  if (ev.type === "scroll") {
    return `Scroll ${ev.direction} ${ev.clicks} (${ev.x},${ev.y})`;
  }
  if (ev.type === "move") {
    return `Move ${ev.mode} (${ev.x},${ev.y})`;
  }
  if (ev.type === "vision") {
    const label = ev.label || "vision";
    const th = Number.isFinite(ev.threshold) ? ev.threshold : 0.85;
    return `Vision ${label} >= ${th}`;
  }
  return ev.type || "evento";
}

function renderEventList(macro) {
  eventList.innerHTML = "";
  macro.events.forEach((ev, idx) => {
    const div = document.createElement("div");
    div.className = "list-item" + (idx === selectedEventIndex ? " active" : "");
    div.textContent = `${idx + 1}. ${eventLabel(ev)}`;
    div.onclick = () => {
      selectedEventIndex = idx;
      renderEventList(macro);
      loadEventToForm(ev);
    };
    eventList.appendChild(div);
  });
}

function loadEventToForm(ev) {
  eventEditor.classList.remove("hidden");
  eventEditorHint.classList.add("hidden");

  eventType.value = ev.type;

  if (ev.type === "delay") {
    delayType.value = ev.mode || "fixed";
    delayValue.value = ev.ms || 100;
    delayMin.value = ev.min || 50;
    delayMax.value = ev.max || 150;
  }

  if (ev.type === "key") {
    keyAction.value = ev.action || "press";
    keyValue.value = ev.key || "";
  }

  if (ev.type === "mouse") {
    mouseAction.value = ev.action || "click";
    mouseButton.value = ev.button || 1;
    mouseX.value = ev.x || 0;
    mouseY.value = ev.y || 0;
  }

  if (ev.type === "scroll") {
    scrollDirection.value = ev.direction || "down";
    scrollClicks.value = ev.clicks || 1;
    scrollX.value = ev.x || 0;
    scrollY.value = ev.y || 0;
  }

  if (ev.type === "move") {
    moveMode.value = ev.mode || "abs";
    moveX.value = ev.x || 0;
    moveY.value = ev.y || 0;
  }

  if (ev.type === "vision") {
    visionLabel.value = ev.label || "minimapopencv";
    visionThreshold.value = ev.threshold != null ? ev.threshold : 0.85;
    visionOnMatch.value = (ev.onMatch && ev.onMatch.action) || "continue";
    visionOnMiss.value = (ev.onMiss && ev.onMiss.action) || "continue";
    visionJumpMatch.value = ev.onMatch && Number.isFinite(ev.onMatch.index) ? ev.onMatch.index + 1 : "";
    visionJumpMiss.value = ev.onMiss && Number.isFinite(ev.onMiss.index) ? ev.onMiss.index + 1 : "";
    const roiEv = ev.roi || roi;
    visionRoiX1.value = roiEv.x1 || 0;
    visionRoiY1.value = roiEv.y1 || 0;
    visionRoiX2.value = roiEv.x2 || 0;
    visionRoiY2.value = roiEv.y2 || 0;
  }

  updateEventFields();
  updateDelayFields();
}

function getEventFromForm() {
  const type = eventType.value;
  if (type === "delay") {
    if (delayType.value === "random") {
      return { type: "delay", mode: "random", min: Number(delayMin.value || 0), max: Number(delayMax.value || 0) };
    }
    return { type: "delay", mode: "fixed", ms: Number(delayValue.value || 0) };
  }

  if (type === "key") {
    return { type: "key", action: keyAction.value, key: keyValue.value || "" };
  }

  if (type === "mouse") {
    return {
      type: "mouse",
      action: mouseAction.value,
      button: Number(mouseButton.value || 1),
      x: Number(mouseX.value || 0),
      y: Number(mouseY.value || 0)
    };
  }

  if (type === "scroll") {
    return {
      type: "scroll",
      direction: scrollDirection.value,
      clicks: Number(scrollClicks.value || 1),
      x: Number(scrollX.value || 0),
      y: Number(scrollY.value || 0)
    };
  }

  if (type === "vision") {
    const jumpMatch = Number(visionJumpMatch.value || 0);
    const jumpMiss = Number(visionJumpMiss.value || 0);
    return {
      type: "vision",
      label: (visionLabel.value || "").trim() || "minimapopencv",
      threshold: Number(visionThreshold.value || 0.85),
      roi: {
        x1: Number(visionRoiX1.value || 0),
        y1: Number(visionRoiY1.value || 0),
        x2: Number(visionRoiX2.value || 0),
        y2: Number(visionRoiY2.value || 0)
      },
      onMatch: {
        action: visionOnMatch.value,
        index: Number.isFinite(jumpMatch) && jumpMatch > 0 ? jumpMatch - 1 : null
      },
      onMiss: {
        action: visionOnMiss.value,
        index: Number.isFinite(jumpMiss) && jumpMiss > 0 ? jumpMiss - 1 : null
      }
    };
  }

  return {
    type: "move",
    mode: moveMode.value,
    x: Number(moveX.value || 0),
    y: Number(moveY.value || 0)
  };
}

function updateDelayFields() {
  if (delayType.value === "random") {
    delayRandomFields.classList.remove("hidden");
    delayFixedFields.classList.add("hidden");
  } else {
    delayRandomFields.classList.add("hidden");
    delayFixedFields.classList.remove("hidden");
  }
}

function updateEventFields() {
  const type = eventType.value;
  document.getElementById("eventDelayFields").classList.toggle("hidden", type !== "delay");
  document.getElementById("eventKeyFields").classList.toggle("hidden", type !== "key");
  document.getElementById("eventMouseFields").classList.toggle("hidden", type !== "mouse");
  document.getElementById("eventScrollFields").classList.toggle("hidden", type !== "scroll");
  document.getElementById("eventMoveFields").classList.toggle("hidden", type !== "move");
  document.getElementById("eventVisionFields").classList.toggle("hidden", type !== "vision");
}

eventType.onchange = () => {
  updateEventFields();
  updateDelayFields();
};

delayType.onchange = () => updateDelayFields();

saveEventBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro || selectedEventIndex == null) return;
  macro.events[selectedEventIndex] = getEventFromForm();
  saveMacros();
  renderEventList(macro);
};

newEventBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro) return;
  const ev = { type: "delay", mode: "fixed", ms: 100 };
  macro.events.push(ev);
  selectedEventIndex = macro.events.length - 1;
  saveMacros();
  renderEventList(macro);
  loadEventToForm(ev);
};

function addEvent(ev) {
  const macro = currentMacro();
  if (!macro) return;
  macro.events.push(ev);
  selectedEventIndex = macro.events.length - 1;
  saveMacros();
  renderEventList(macro);
  loadEventToForm(ev);
}

addDelayBtn.onclick = () => {
  const ms = Number(addDelayValue.value || 0);
  addEvent({ type: "delay", mode: "fixed", ms });
};
addDelay35Btn.onclick = () => addEvent({ type: "delay", mode: "random", min: 3000, max: 5000 });
addKeyBtn.onclick = () => addEvent({ type: "key", action: "press", key: "ctrl+c" });
addF1Btn.onclick = () => addEvent({ type: "key", action: "press", key: "F1" });
addF2Btn.onclick = () => addEvent({ type: "key", action: "press", key: "F2" });
addF3Btn.onclick = () => addEvent({ type: "key", action: "press", key: "F3" });
addKey1Btn.onclick = () => addEvent({ type: "key", action: "press", key: "1" });
addKey2Btn.onclick = () => addEvent({ type: "key", action: "press", key: "2" });
addKey3Btn.onclick = () => addEvent({ type: "key", action: "press", key: "3" });
addClickLeftBtn.onclick = () => {
  if (!currentMacro()) {
    alert("Selecione uma macro antes de adicionar click");
    return;
  }
  pendingAddClick = 1;
  captureStatus.textContent = "Add Click L: clique na tela";
};
addClickRightBtn.onclick = () => {
  if (!currentMacro()) {
    alert("Selecione uma macro antes de adicionar click");
    return;
  }
  pendingAddClick = 3;
  captureStatus.textContent = "Add Click R: clique na tela";
};
addScrollBtn.onclick = () => addEvent({ type: "scroll", direction: "down", clicks: 3, x: 500, y: 300 });
addVisionBtn.onclick = () => addEvent({
  type: "vision",
  label: "minimapopencv",
  threshold: 0.85,
  roi: { ...roi },
  onMatch: { action: "continue", index: null },
  onMiss: { action: "continue", index: null }
});

visionUseRoi.onclick = () => {
  visionRoiX1.value = roi.x1;
  visionRoiY1.value = roi.y1;
  visionRoiX2.value = roi.x2;
  visionRoiY2.value = roi.y2;
};

moveUpBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro || selectedEventIndex == null) return;
  const idx = selectedEventIndex;
  if (idx <= 0) return;
  const tmp = macro.events[idx - 1];
  macro.events[idx - 1] = macro.events[idx];
  macro.events[idx] = tmp;
  selectedEventIndex = idx - 1;
  saveMacros();
  renderEventList(macro);
};

moveDownBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro || selectedEventIndex == null) return;
  const idx = selectedEventIndex;
  if (idx >= macro.events.length - 1) return;
  const tmp = macro.events[idx + 1];
  macro.events[idx + 1] = macro.events[idx];
  macro.events[idx] = tmp;
  selectedEventIndex = idx + 1;
  saveMacros();
  renderEventList(macro);
};

removeActionBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro || selectedEventIndex == null) return;
  macro.events.splice(selectedEventIndex, 1);
  selectedEventIndex = null;
  saveMacros();
  renderEventList(macro);
  eventEditor.classList.add("hidden");
  eventEditorHint.classList.remove("hidden");
};

newMacroBtn.onclick = () => {
  const name = prompt("Nome da macro:");
  if (!name) return;
  const macro = {
    id: Date.now(),
    name,
    loop: true,
    loopCount: 0,
    events: []
  };
  macros.push(macro);
  currentMacroId = macro.id;
  selectedEventIndex = null;
  saveMacros();
  renderMacroList();
  renderMacroEditor();
};

deleteMacroBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro) return;
  macros = macros.filter((m) => m.id !== macro.id);
  currentMacroId = macros[0] ? macros[0].id : null;
  selectedEventIndex = null;
  saveMacros();
  renderMacroList();
  renderMacroEditor();
};

duplicateMacroBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro) return;
  const copy = JSON.parse(JSON.stringify(macro));
  copy.id = Date.now();
  copy.name = `${macro.name} copy`;
  macros.push(copy);
  currentMacroId = copy.id;
  selectedEventIndex = null;
  saveMacros();
  renderMacroList();
  renderMacroEditor();
};

saveMacroBtn.onclick = () => {
  const macro = currentMacro();
  if (!macro) return;
  macro.name = (macroName.value || "").trim() || macro.name;
  macro.loop = !!macroLoop.checked;
  macro.loopCount = Number(macroLoopCount.value || 0);
  saveMacros();
  renderMacroList();
};

captureCoordsBtn.onclick = () => {
  if (!currentMacro()) return;
  setCaptureState(!coordCaptureActive);
};

function recordEvent(ev, ts) {
  const macro = currentMacro();
  if (!macro) return;
  if (lastEventTs > 0) {
    const delta = ts - lastEventTs;
    if (delta > 0) {
      macro.events.push({ type: "delay", mode: "fixed", ms: delta });
    }
  }
  macro.events.push(ev);
  lastEventTs = ts;
  selectedEventIndex = macro.events.length - 1;
  saveMacros();
  renderEventList(macro);
}

function recordMouseDown(e, x, y) {
  const button = e.button === 1 ? 2 : e.button === 2 ? 3 : 1;
  if (recPressDuration.checked) {
    recordEvent({ type: "mouse", action: "down", button, x, y }, Date.now());
  }
}

function recordMouseUp(e, x, y) {
  const button = e.button === 1 ? 2 : e.button === 2 ? 3 : 1;
  if (recPressDuration.checked) {
    recordEvent({ type: "mouse", action: "up", button, x, y }, Date.now());
  } else {
    recordEvent({ type: "mouse", action: "click", button, x, y }, Date.now());
  }
}

function startRecording() {
  if (!currentMacro()) {
    alert("Crie ou selecione uma macro antes de gravar");
    return;
  }
  recording = true;
  lastEventTs = 0;
  lastMoveTs = 0;
  recordBtn.disabled = true;
  stopRecordBtn.disabled = false;
  recordBtn.classList.add("danger");
}

function stopRecording() {
  recording = false;
  recordBtn.disabled = false;
  stopRecordBtn.disabled = true;
  recordBtn.classList.remove("danger");
}

recordBtn.onclick = () => startRecording();
stopRecordBtn.onclick = () => stopRecording();

function normalizeJumpIndex(value) {
  if (!Number.isFinite(value)) return null;
  if (value < 0) return null;
  return value;
}

async function analyzeVisionEvent(ev) {
  if (!lastFrameImg) {
    return { match: false, score: 0, label: ev.label || "" };
  }
  const roiEv = ev.roi || roi;
  const w = Math.max(1, (roiEv.x2 || 0) - (roiEv.x1 || 0));
  const h = Math.max(1, (roiEv.y2 || 0) - (roiEv.y1 || 0));

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const offCtx = off.getContext("2d");
  try {
    offCtx.drawImage(lastFrameImg, roiEv.x1, roiEv.y1, w, h, 0, 0, w, h);
  } catch {
    return { match: false, score: 0, label: ev.label || "" };
  }

  const payload = {
    image_b64: off.toDataURL("image/png"),
    label: ev.label || "",
    threshold: ev.threshold != null ? ev.threshold : 0.85
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(analyzerUrl.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await res.json();
    return {
      match: !!data.match,
      score: Number(data.score || 0),
      label: data.label || ev.label || ""
    };
  } catch (err) {
    logError("Vision analyzer error", err);
    return { match: false, score: 0, label: ev.label || "" };
  } finally {
    clearTimeout(timeout);
  }
}

async function playMacro(macro) {
  if (!macro || !macro.events.length) return;
  if (runningMacros[macro.id]) return;

  runningMacros[macro.id] = { stop: false };
  renderMacroList();

  const loopMax = macro.loop ? (macro.loopCount > 0 ? macro.loopCount : Infinity) : 1;
  let loopCount = 0;

  while (loopCount < loopMax && !runningMacros[macro.id].stop) {
    let idx = 0;
    while (idx < macro.events.length) {
      if (runningMacros[macro.id].stop) break;
      const ev = macro.events[idx];

      if (ev.type === "delay") {
        const delay = ev.mode === "random"
          ? Math.random() * (ev.max - ev.min) + ev.min
          : ev.ms || 0;
        await new Promise((r) => setTimeout(r, delay));
        idx += 1;
        continue;
      }

      if (ev.type === "vision") {
        const result = await analyzeVisionEvent(ev);
        const branch = result.match ? ev.onMatch : ev.onMiss;
        if (branch && branch.action === "stop") {
          runningMacros[macro.id].stop = true;
          break;
        }
        if (branch && branch.action === "jump") {
          const target = normalizeJumpIndex(branch.index);
          if (target != null && target < macro.events.length) {
            idx = target;
            continue;
          }
        }
        idx += 1;
        continue;
      }

      if (ev.type === "key") {
        if (ev.action === "down") {
          sendInput({ type: "input", event: "key_down", key: ev.key });
        } else if (ev.action === "up") {
          sendInput({ type: "input", event: "key_up", key: ev.key });
        } else {
          sendInput({ type: "input", event: "key", key: ev.key });
        }
      }

      if (ev.type === "mouse") {
        if (ev.action === "down") {
          sendInput({ type: "input", event: "mouse_down", button: ev.button, x: ev.x, y: ev.y });
        } else if (ev.action === "up") {
          sendInput({ type: "input", event: "mouse_up", button: ev.button, x: ev.x, y: ev.y });
        } else {
          sendInput({ type: "input", event: "mouse_click", button: ev.button, x: ev.x, y: ev.y });
        }
      }

      if (ev.type === "scroll") {
        sendInput({ type: "input", event: "scroll", direction: ev.direction, clicks: ev.clicks, x: ev.x, y: ev.y });
      }

      if (ev.type === "move") {
        if (ev.mode === "rel") {
          sendInput({ type: "input", event: "mouse_move_rel", x: ev.x, y: ev.y });
        } else {
          sendInput({ type: "input", event: "mouse_move", x: ev.x, y: ev.y });
        }
      }

      idx += 1;
    }
    loopCount += 1;
  }

  delete runningMacros[macro.id];
  renderMacroList();
}

playMacroBtn.onclick = () => {
  const macro = currentMacro();
  playMacro(macro);
};

function stopMacro(id) {
  if (runningMacros[id]) {
    runningMacros[id].stop = true;
    renderMacroList();
  }
}

stopAllMacrosBtn.onclick = () => {
  Object.keys(runningMacros).forEach((id) => {
    runningMacros[id].stop = true;
  });
  renderMacroList();
};

renderMacroList();
renderMacroEditor();
log("Client inicializado");

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
const connStatus = document.getElementById("connStatus");
const latency = document.getElementById("latency");
const fps = document.getElementById("fps");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
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
const macroList = document.getElementById("macroList");
const recordBtn = document.getElementById("recordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const playMacroBtn = document.getElementById("playMacroBtn");
const addDelayBtn = document.getElementById("addDelayBtn");
const addDelayValue = document.getElementById("addDelayValue");
const addKeyBtn = document.getElementById("addKeyBtn");
const addClickLeftBtn = document.getElementById("addClickLeftBtn");
const addClickRightBtn = document.getElementById("addClickRightBtn");
const addScrollBtn = document.getElementById("addScrollBtn");
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

const recKeys = document.getElementById("recKeys");
const recClicks = document.getElementById("recClicks");
const recAbsMove = document.getElementById("recAbsMove");
const recRelMove = document.getElementById("recRelMove");
const recPressDuration = document.getElementById("recPressDuration");

ip.value = localStorage.getItem("linux_ip") || "";

function setConnectionUi(connected) {
  connStatus.textContent = connected ? "Conectado" : "Desconectado";
  connectBtn.disabled = connected;
  disconnectBtn.disabled = !connected;
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

pauseStreamBtn.onclick = () => {
  sendInput({ type: "stream", action: "pause" });
};

resumeStreamBtn.onclick = () => {
  sendInput({ type: "stream", action: "resume" });
};

function drawFrame(b64, format) {
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  const fmt = format || "jpeg";
  img.src = `data:image/${fmt};base64,` + b64;
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
addKeyBtn.onclick = () => addEvent({ type: "key", action: "press", key: "ctrl+c" });
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

async function playMacro(macro) {
  if (!macro || !macro.events.length) return;
  if (runningMacros[macro.id]) return;

  runningMacros[macro.id] = { stop: false };
  renderMacroList();

  const loopMax = macro.loop ? (macro.loopCount > 0 ? macro.loopCount : Infinity) : 1;
  let loopCount = 0;

  while (loopCount < loopMax && !runningMacros[macro.id].stop) {
    for (const ev of macro.events) {
      if (runningMacros[macro.id].stop) break;
      if (ev.type === "delay") {
        const delay = ev.mode === "random"
          ? Math.random() * (ev.max - ev.min) + ev.min
          : ev.ms || 0;
        await new Promise((r) => setTimeout(r, delay));
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

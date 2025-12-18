import time
import signal
import sys

from mouse import click, right_click, type_text, clear_input
from logger import log
from statistics_parser import copy_statistics
from storage import save_csv
from items_loader import load_items

# ======================
# POSIÇÕES FIXAS (UI)
# ======================

DEPOT_POS = (781, 516)
MARKET_POS = (1879, 1002)
MARKET_CLOSE_POS = (1406, 835)

SEARCH_FIELD_POS = (538, 797)
ITEM_FIRST_POS = (499, 528)
DETAILS_POS = (1249, 838)

# ======================
# TEMPOS (segundos)
# ======================

START_DELAY = 2
OPEN_DELAY = 6
ACTION_DELAY = 1
ITEM_BATCH_SIZE = 25

# ======================
# CONTROLE DE ENCERRAMENTO
# ======================

def graceful_exit(signum, frame):
    log("🛑 Script interrupted by user (SSH-safe)")
    log("Script terminated gracefully")
    sys.exit(0)

signal.signal(signal.SIGINT, graceful_exit)
signal.signal(signal.SIGTERM, graceful_exit)

# ======================
# AÇÕES ESTRUTURAIS
# ======================

def open_depot_and_market():
    log("== OPEN: depot -> market ==")

    log(f"🟦 MOVE  x={DEPOT_POS[0]} y={DEPOT_POS[1]}")
    right_click(*DEPOT_POS)
    time.sleep(OPEN_DELAY)

    log(f"🟦 MOVE  x={MARKET_POS[0]} y={MARKET_POS[1]}")
    right_click(*MARKET_POS)
    time.sleep(OPEN_DELAY)


def close_market():
    log("== CLOSE: market ==")
    click(*MARKET_CLOSE_POS)
    time.sleep(1)
    click(*MARKET_CLOSE_POS)
    time.sleep(2)


def movement_pause():
    log("⬆️ Moving up")
    type_text("")  # garante foco
    time.sleep(1)
    sys.stdout.flush()
    click(0, 0)  # no-op visual
    time.sleep(1)

    log("⬇️ Moving down")
    time.sleep(1)

# ======================
# PROCESSAMENTO DE ITEM
# ======================

def process_item(item_name: str):
    log(f"== ITEM START: {item_name} ==")

    log("Step: focus search field")
    click(*SEARCH_FIELD_POS)
    time.sleep(ACTION_DELAY)

    log("Step: clear search")
    clear_input()
    time.sleep(ACTION_DELAY)

    log("Step: type item name")
    type_text(item_name)
    time.sleep(6)

    log("Step: select first result")
    click(*ITEM_FIRST_POS)
    time.sleep(ACTION_DELAY)

    log("Step: open DETAILS")
    click(*DETAILS_POS)
    time.sleep(ACTION_DELAY)

    log("Step: copy + parse statistics")
    stats = copy_statistics()

    if stats is None:
        log(f"🚫 Item '{item_name}' not available on Market")
        return False

    save_csv(item_name, stats)
    log(f"✅ Statistics saved for {item_name}")
    return True

# ======================
# FLUXO PRINCIPAL
# ======================

def run_market_flow():
    log("🚀 Starting Tibia Market Bot (DEV MODE)")
    time.sleep(START_DELAY)

    items = load_items()
    log(f"📦 Loaded {len(items)} item(s)")

    open_depot_and_market()

    for idx, item in enumerate(items, start=1):
        process_item(item)

        if idx == 1 or idx % ITEM_BATCH_SIZE == 0:
            close_market()
            movement_pause()
            open_depot_and_market()

    close_market()
    log("🏁 All items processed successfully")

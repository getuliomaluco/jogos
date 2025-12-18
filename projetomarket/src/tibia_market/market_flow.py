import time
import signal
import sys

from mouse import click, right_click, type_text, clear_input
from logger import log
from statistics_parser import copy_statistics
from storage import save_csv
from items_loader import load_items


def handle_exit(signum, frame):
    log("Received exit signal. Exiting safely.")
    sys.exit(0)


signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)


def safe_click(x, y, dry_run):
    if dry_run:
        log(f"[DRY-RUN] click at x={x} y={y}")
    else:
        click(x, y)


def safe_right_click(x, y, dry_run):
    if dry_run:
        log(f"[DRY-RUN] right_click at x={x} y={y}")
    else:
        right_click(x, y)


def run_market_flow(dry_run=False):
    log(f"Running market flow (dry_run={dry_run})")

    items = load_items()
    if not items:
        log("No items loaded. Exiting.")
        return

    # Aguarda antes de iniciar
    time.sleep(1)

    # Abrir Depot
    log("Opening depot")
    safe_right_click(781, 516, dry_run)
    time.sleep(1)

    # Abrir Market
    log("Opening market")
    safe_right_click(1881, 989, dry_run)
    time.sleep(2)

    # Processar itens
    for item in items:
        log(f"Processing item: {item}")

        if dry_run:
            log(f"[DRY-RUN] Would search item: {item}")
        else:
            clear_input()
            type_text(item)
            time.sleep(1)

        # Abrir Details
        log("Opening item details")
        safe_click(1249, 838, dry_run)
        time.sleep(1)

        # Copiar estatísticas
        log("Copying statistics")
        stats = copy_statistics(dry_run=dry_run)

        if stats:
            log("Saving statistics")
            save_csv(item, stats)
        else:
            log("No statistics captured")

        time.sleep(1)

    log("Market flow finished")

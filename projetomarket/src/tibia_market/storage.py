import csv
import os
from datetime import date
from logger import log

CSV_FILE = "market_statistics.csv"
MAX_LINES = 10_000


def _count_lines(path):
    if not os.path.exists(path):
        return 0
    with open(path, "r", encoding="utf-8") as f:
        return sum(1 for _ in f)


def _already_collected(today, item_name):
    if not os.path.exists(CSV_FILE):
        return False

    with open(CSV_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["date"] == today and row["item"] == item_name:
                return True
    return False


def save_csv(item_name, stats: dict):
    today = date.today().isoformat()

    if _already_collected(today, item_name):
        log(f"ℹ️ Data for '{item_name}' already collected today ({today}). Skipping.")
        return

    total_lines = _count_lines(CSV_FILE)
    if total_lines >= MAX_LINES:
        log("❌ CSV limit reached (10k lines). Aborting to avoid corruption.")
        raise RuntimeError("CSV line limit reached")

    file_exists = os.path.exists(CSV_FILE)

    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow([
                "date",
                "item",
                "transactions_buy",
                "buy_high",
                "buy_avg",
                "buy_low",
                "transactions_sell",
                "sell_high",
                "sell_avg",
                "sell_low",
            ])

        writer.writerow([
            today,
            item_name,
            stats["buy"]["tx"],
            stats["buy"]["high"],
            stats["buy"]["avg"],
            stats["buy"]["low"],
            stats["sell"]["tx"],
            stats["sell"]["high"],
            stats["sell"]["avg"],
            stats["sell"]["low"],
        ])

    log(f"💾 Saved statistics for '{item_name}'")

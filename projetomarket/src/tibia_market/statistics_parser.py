import re
import time
import subprocess
from logger import log
from mouse import click, right_click

# POSIÇÕES
STATS_FOCUS_POS = (768, 531)
SELECT_ALL_POS = (795, 531)
STATS_RIGHT_CLICK_POS = (764, 529)
COPY_POS = (794, 540)

MAX_ATTEMPTS = 2


def clear_clipboard():
    subprocess.run(
        ["bash", "-c", "printf '' | xclip -selection clipboard"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    log("CLIPBOARD cleared")


def read_clipboard():
    try:
        return subprocess.check_output(
            ["xclip", "-selection", "clipboard", "-o"],
            stderr=subprocess.DEVNULL,
        ).decode().strip()
    except subprocess.CalledProcessError:
        return ""


def parse_statistics(text: str) -> dict:
    def extract_block(block_name):
        pattern = rf"{block_name}:\s+Number of Transactions:\s+(\d+).*?Highest Price:\s+([\d,]+).*?Average Price:\s+([\d,]+).*?Lowest Price:\s+([\d,]+)"
        match = re.search(pattern, text, re.S)
        if not match:
            return None
        return {
            "tx": int(match.group(1)),
            "high": int(match.group(2).replace(",", "")),
            "avg": int(match.group(3).replace(",", "")),
            "low": int(match.group(4).replace(",", "")),
        }

    buy = extract_block("Buy Offers")
    sell = extract_block("Sell Offers")

    if not buy or not sell:
        return None

    return {"buy": buy, "sell": sell}


def copy_statistics():
    for attempt in range(1, MAX_ATTEMPTS + 1):
        log(f"📋 Copy attempt {attempt}/{MAX_ATTEMPTS}")

        clear_clipboard()
        time.sleep(0.4)

        right_click(*STATS_FOCUS_POS)
        time.sleep(0.4)

        click(*SELECT_ALL_POS)
        time.sleep(0.4)

        right_click(*STATS_RIGHT_CLICK_POS)
        time.sleep(0.4)

        click(*COPY_POS)
        time.sleep(0.6)

        text = read_clipboard()
        log("Statistics clipboard raw:")
        log(text if text else "<EMPTY>")

        if "Buy Offers:" in text and "Sell Offers:" in text:
            parsed = parse_statistics(text)
            if parsed:
                return parsed

        log("⚠️ Clipboard content invalid, retrying...")
        time.sleep(1)

    log("🚫 Item not found in market (no statistics)")
    return None

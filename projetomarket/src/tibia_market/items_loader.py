from logger import log


def load_items(path="items.txt"):
    with open(path, "r") as f:
        raw = f.read().strip()

    items = [i.strip().lower() for i in raw.split(",") if i.strip()]
    log(f"📦 Loaded {len(items)} item(s) from {path}")
    return items

import time
from logger import log
from market_flow import run_market_flow

if __name__ == "__main__":
    log("Starting Tibia Market Bot (DEV MODE)")
    time.sleep(2)

    try:
        run_market_flow()
    except KeyboardInterrupt:
        log("🛑 Script interrupted by user (SSH-safe)")
    finally:
        log("Script terminated gracefully")

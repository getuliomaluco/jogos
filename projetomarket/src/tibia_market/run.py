import os
import time
from logger import log
from market_flow import run_market_flow
from preflight import run_preflight_checks


DRY_RUN = os.getenv("DRY_RUN", "0") == "1"


def main():
    log(f"Starting Tibia Market RPA (dry_run={DRY_RUN})")

    # Validações antes de qualquer ação
    run_preflight_checks()

    time.sleep(1)

    try:
        run_market_flow(dry_run=DRY_RUN)
    except KeyboardInterrupt:
        log("🛑 Script interrupted by user")
    except Exception as e:
        log(f"❌ Unexpected error: {e}")
    finally:
        log("Script terminated gracefully")


if __name__ == "__main__":
    main()

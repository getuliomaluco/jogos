import subprocess
import sys
from logger import log


EXPECTED_MIN_WIDTH = 1280
EXPECTED_MIN_HEIGHT = 720
TIBIA_CLASS_NAME = "tibia"


def fail(message):
    log(f"❌ PRE-FLIGHT CHECK FAILED: {message}")
    sys.exit(1)


def check_tibia_running():
    try:
        result = subprocess.check_output(
            ["xdotool", "search", "--onlyvisible", "--class", TIBIA_CLASS_NAME],
            stderr=subprocess.DEVNULL,
        )
        pid = result.decode().strip().split("\n")[0]
        log(f"✅ Tibia process found (PID={pid})")
        return pid
    except subprocess.CalledProcessError:
        fail("Tibia client not running or not visible")


def check_screen_resolution():
    try:
        output = subprocess.check_output(
            ["xdpyinfo"], stderr=subprocess.DEVNULL
        ).decode()

        for line in output.splitlines():
            if "dimensions:" in line:
                dims = line.split()[1]
                width, height = map(int, dims.split("x"))

                log(f"🖥 Screen resolution detected: {width}x{height}")

                if width < EXPECTED_MIN_WIDTH or height < EXPECTED_MIN_HEIGHT:
                    fail(
                        f"Resolution too low ({width}x{height}). "
                        f"Minimum required is {EXPECTED_MIN_WIDTH}x{EXPECTED_MIN_HEIGHT}"
                    )
                return
        fail("Unable to detect screen resolution")
    except Exception as e:
        fail(f"Error checking screen resolution: {e}")


def check_not_fullscreen():
    try:
        output = subprocess.check_output(
            ["wmctrl", "-lG"], stderr=subprocess.DEVNULL
        ).decode()

        for line in output.splitlines():
            if TIBIA_CLASS_NAME.lower() in line.lower():
                parts = line.split()
                width = int(parts[4])
                height = int(parts[5])

                log(f"🪟 Tibia window size: {width}x{height}")

                if width >= EXPECTED_MIN_WIDTH and height >= EXPECTED_MIN_HEIGHT:
                    log("✅ Tibia window is not fullscreen")
                    return
        fail("Tibia window not found for fullscreen check")
    except Exception as e:
        fail(f"Error checking fullscreen mode: {e}")


def run_preflight_checks():
    log("🔍 Running pre-flight checks")
    check_tibia_running()
    check_screen_resolution()
    check_not_fullscreen()
    log("✅ Pre-flight checks passed successfully")

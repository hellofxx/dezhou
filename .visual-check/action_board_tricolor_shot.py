"""
临时验证：ActionBoard 三档配色（frost / brass / clay）桌面 + 移动截图。
用完即删。
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174/dezhou"
OUT_DIR = ".visual-check"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

ONBOARDING_PAYLOAD = {
    "state": {
        "onboarding": {"completed": True, "currentStepId": None, "skippedSteps": []},
    },
    "version": 0,
}
PAYLOAD_JSON = json.dumps(ONBOARDING_PAYLOAD, separators=(",", ":"))


def inject_onboarding_skip(context):
    context.add_init_script(
        f"""
        window.localStorage.setItem('poker-training-progress', {json.dumps(PAYLOAD_JSON)});
        """
    )


def shoot(page, name: str) -> None:
    out = f"{OUT_DIR}/{name}.png"
    page.screenshot(path=out, full_page=False)
    print(f"  saved {out}")


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for tag, viewport in (("desktop", DESKTOP), ("mobile", MOBILE)):
            ctx = browser.new_context(viewport=viewport, device_scale_factor=1.5)
            inject_onboarding_skip(ctx)
            page = ctx.new_page()
            url = f"{BASE}/puzzle/daily"
            print(f"[{tag}] visiting {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            try:
                page.wait_for_selector(".action-tile", timeout=8000)
            except Exception as e:
                print(f"  warn: .action-tile not ready ({e})")
            page.wait_for_timeout(800)
            shoot(page, f"action-board-tricolor-{tag}")
            ctx.close()
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

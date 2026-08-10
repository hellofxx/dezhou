"""临时验证：ActionBoard passive 改为石板靛后的截图"""
import os, sys, json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174/dezhou"
OUT_DIR = ".visual-check"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

PAYLOAD_JSON = json.dumps({"state": {"onboarding": {"completed": True, "currentStepId": None, "skippedSteps": []}}, "version": 0})


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for tag, viewport in (("desktop", DESKTOP), ("mobile", MOBILE)):
            ctx = browser.new_context(viewport=viewport, device_scale_factor=1.5)
            ctx.add_init_script(f"window.localStorage.setItem('poker-training-progress', '{PAYLOAD_JSON}')")
            page = ctx.new_page()
            page.goto(f"{BASE}/puzzle/daily", wait_until="domcontentloaded", timeout=15000)
            try:
                page.wait_for_selector(".action-tile", timeout=8000)
            except Exception as e:
                print(f"  warn: {e}")
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT_DIR}/action-board-indigo-{tag}.png", full_page=False)
            print(f"  saved {OUT_DIR}/action-board-indigo-{tag}.png")
            ctx.close()
        browser.close()


if __name__ == "__main__":
    main()

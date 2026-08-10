"""临时验证：ActionBoard light theme 下三色按钮表现"""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174/dezhou"
OUT_DIR = ".visual-check"

PAYLOAD = json.dumps({"state": {"onboarding": {"completed": True, "currentStepId": None, "skippedSteps": []}}, "version": 0})


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
        ctx.add_init_script(f"window.localStorage.setItem('poker-training-progress', '{PAYLOAD}')")
        page = ctx.new_page()
        page.goto(f"{BASE}/puzzle/daily", wait_until="domcontentloaded", timeout=15000)
        try:
            page.wait_for_selector(".action-tile", timeout=8000)
        except Exception:
            pass
        # 切换 light theme（若主题存于 html data-theme 或 localStorage）
        page.evaluate("document.documentElement.setAttribute('data-theme', 'light')")
        page.wait_for_timeout(600)
        page.screenshot(path=f"{OUT_DIR}/action-board-light.png", full_page=False)
        print("  saved action-board-light.png")
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()

import os
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou\.visual-check"
BASE = "http://localhost:5173/dezhou"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, viewport, path):
        ctx = browser.new_context(viewport=viewport, locale="zh-CN")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(500)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=3000)
            page.wait_for_timeout(300)
        except Exception:
            pass
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(1400)
        page.screenshot(path=os.path.join(OUT, f"{label}.png"), full_page=True)
        print(f"[{label}] saved. errors: {errors[:3]}")
        ctx.close()

    capture("puzzle-desktop", {"width": 1280, "height": 900}, "/puzzle")
    capture("puzzle-mobile", {"width": 390, "height": 2400}, "/puzzle")
    capture("settings-desktop", {"width": 1280, "height": 900}, "/settings")
    capture("settings-mobile", {"width": 390, "height": 2600}, "/settings")

    browser.close()

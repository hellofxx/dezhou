import os
import json
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou\.visual-check"
BASE = "http://localhost:5173/dezhou"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, viewport):
        ctx = browser.new_context(viewport=viewport, locale="zh-CN")
        page = ctx.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(600)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=4000)
            page.wait_for_timeout(400)
        except Exception:
            pass
        page.goto(f"{BASE}/academy", wait_until="networkidle")
        page.wait_for_timeout(1200)
        seg_before = page.evaluate(
            "() => [...document.querySelectorAll('.variant-seg-btn')].map(b => b.innerText.trim())"
        )
        print(f"[{label}] seg_before:", seg_before)
        # 切换到短牌验证联动与中文标签（匹配第一个含“短牌”的按钮）
        page.get_by_text("短牌", exact=False).first.click(timeout=4000)
        page.wait_for_timeout(900)
        seg = page.evaluate(
            "() => [...document.querySelectorAll('.variant-seg-btn')].map(b => b.innerText.trim())"
        )
        panel = page.evaluate(
            "() => (document.querySelector('.variant-panel')?.innerText || '').replace(/\\n/g, ' | ').slice(0, 200)"
        )
        print(f"[{label}] seg:", seg)
        print(f"[{label}] panel:", panel)
        out_path = os.path.join(OUT, f"variant-{label}.png")
        page.screenshot(path=out_path, full_page=True)
        print(f"[{label}] saved {out_path} errors:", errors[:5] if errors else "none")
        ctx.close()

    capture("desktop", {"width": 1440, "height": 1400})
    capture("mobile", {"width": 390, "height": 1400})

    browser.close()

import os
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou\.visual-check"
BASE = "http://localhost:5173/dezhou"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, path, scroll_to=None):
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="zh-CN")
        page = ctx.new_page()
        page.on("console", lambda msg: print(f"[{label}][{msg.type}] {msg.text}"))
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(400)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=3000)
            page.wait_for_timeout(300)
        except Exception:
            pass
        page.goto(f"{BASE}{path}", wait_until="networkidle")
        page.wait_for_timeout(1200)
        if scroll_to:
            info = page.evaluate(f"""() => {{
                const el = document.querySelector('{scroll_to}');
                if (!el) return {{found: false}};
                const main = document.querySelector('main');
                const before = {{scrollTop: main.scrollTop, scrollHeight: main.scrollHeight, clientHeight: main.clientHeight}};
                el.scrollIntoView({{behavior:'instant',block:'start'}});
                const after = {{scrollTop: main.scrollTop, scrollHeight: main.scrollHeight, clientHeight: main.clientHeight, rectTop: el.getBoundingClientRect().top}};
                return {{found: true, before, after}};
            }}""")
            print(f"[{label}] scroll-info: {info}")
            page.wait_for_timeout(800)
        debug = page.evaluate("""() => {
            const active = document.querySelector('.settings-nav-item.active');
            return {activeNav: active?.textContent?.trim() || 'none'};
        }""")
        print(f"[{label}] RESULT activeNav={debug.get('activeNav')!r}")
        ctx.close()

    capture("test-top", "/settings")
    capture("test-bottom", "/settings", scroll_to="#settings-section-about")
    browser.close()
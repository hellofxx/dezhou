import os
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou\.visual-check"
BASE = "http://localhost:5173/dezhou"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def setup(page):
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(400)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=3000)
            page.wait_for_timeout(300)
        except Exception:
            pass

    def nav_state(page):
        return page.evaluate("""() => {
            const active = document.querySelector('.settings-nav-item.active');
            return active?.textContent?.trim() || 'none';
        }""")

    def capture(label, viewport, after_action=None):
        ctx = browser.new_context(viewport=viewport, locale="zh-CN")
        page = ctx.new_page()
        setup(page)
        page.goto(f"{BASE}/settings", wait_until="networkidle")
        page.wait_for_timeout(1000)
        initial = nav_state(page)
        if after_action:
            after_action(page)
            page.wait_for_timeout(500)
        after = nav_state(page)
        page.screenshot(path=os.path.join(OUT, f"{label}.png"), full_page=False)
        print(f"[{label}] initial={initial!r} after={after!r}")
        ctx.close()

    # top：未滚动 → 「外观」高亮
    capture("settings-fix-top", {"width": 1280, "height": 900})

    # click 教练风格 → 高亮「教练风格」
    def click_coach(page):
        page.locator('.settings-nav-item').nth(1).click()
    capture("settings-fix-click-coach", {"width": 1280, "height": 900}, click_coach)

    # click 关于 → 高亮「关于」
    def click_about(page):
        page.locator('.settings-nav-item').nth(6).click()
    capture("settings-fix-click-about", {"width": 1280, "height": 900}, click_about)

    capture("settings-fix-mobile", {"width": 390, "height": 2600})

    browser.close()
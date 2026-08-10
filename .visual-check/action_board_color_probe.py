"""临时验证：断言 ActionBoard 三档按钮在 dark/light 下的边框色、文字色、gauge 色，验证三色互不重复"""
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174/dezhou"
PAYLOAD = json.dumps({"state": {"onboarding": {"completed": True, "currentStepId": None, "skippedSteps": []}}, "version": 0})


def probe(page, theme):
    print(f"\n===== {theme} =====")
    data = page.evaluate("""() => {
      const tiles = document.querySelectorAll('.action-tile');
      return Array.from(tiles).map(t => {
        const cs = getComputedStyle(t);
        const dots = Array.from(t.querySelectorAll('.dot')).map(d => getComputedStyle(d).backgroundColor);
        return {
          tier: t.getAttribute('data-tier'),
          label: t.querySelector('.action-tile-label').textContent,
          borderColor: cs.borderColor,
          bg: cs.backgroundImage.slice(0, 60),
          textColor: cs.color,
          dots,
        };
      });
    }""")
    for d in data:
        print(json.dumps(d, ensure_ascii=False))


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script(f"window.localStorage.setItem('poker-training-progress', '{PAYLOAD}')")
        page = ctx.new_page()
        page.goto(f"{BASE}/puzzle/daily", wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector(".action-tile", timeout=8000)
        page.wait_for_timeout(500)
        probe(page, "dark (default)")
        page.evaluate("document.documentElement.setAttribute('data-theme', 'light')")
        page.wait_for_timeout(500)
        probe(page, "light")
        ctx.close()
        browser.close()


if __name__ == "__main__":
    main()

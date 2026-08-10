"""
调试：dump 每个 tile 的 dot className
"""
from playwright.sync_api import sync_playwright
import json

BASE = "http://localhost:5174/dezhou"

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    ctx.add_init_script("""
        window.localStorage.setItem('poker-training-progress', JSON.stringify({
          state: { onboarding: { completed: true, currentStepId: null, skippedSteps: [] } },
          version: 0
        }));
    """)
    page = ctx.new_page()
    page.goto(f"{BASE}/puzzle/daily", wait_until="domcontentloaded", timeout=15000)
    page.wait_for_selector(".action-tile", timeout=8000)
    page.wait_for_timeout(500)
    info = page.evaluate("""
    () => {
      const tiles = document.querySelectorAll('.action-tile');
      return Array.from(tiles).map(t => ({
        tier: t.dataset.tier,
        title: t.querySelector('.action-tile-label')?.textContent,
        dotClasses: Array.from(t.querySelectorAll('.action-tile-gauge .dot')).map(d => d.className),
        bg: window.getComputedStyle(t).backgroundColor,
        color: window.getComputedStyle(t.querySelector('.action-tile-label')).color,
      }));
    }
    """)
    print(json.dumps(info, indent=2, ensure_ascii=False))
    browser.close()

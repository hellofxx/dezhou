"""
调试：dump 渲染后的 ActionBoard 实际 className
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
      const board = document.querySelector('.action-board');
      const tiles = document.querySelectorAll('.action-tile');
      const sample = tiles[0];
      const boardRect = board ? board.getBoundingClientRect() : null;
      const tileRects = Array.from(tiles).map(t => t.getBoundingClientRect());
      return {
        boardClassName: board ? board.className : null,
        boardWidth: boardRect ? boardRect.width : null,
        boardHeight: boardRect ? boardRect.height : null,
        boardDisplay: board ? window.getComputedStyle(board).display : null,
        boardGridCols: board ? window.getComputedStyle(board).gridTemplateColumns : null,
        tileCount: tiles.length,
        tileRects: tileRects.map(r => ({x: r.x, w: r.width, h: r.height})),
        tileClassName: sample ? sample.className : null,
      };
    }
    """)
    print(json.dumps(info, indent=2, ensure_ascii=False))
    browser.close()

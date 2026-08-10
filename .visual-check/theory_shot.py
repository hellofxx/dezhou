import os
import json
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou\.visual-check"
BASE = "http://localhost:5173/dezhou"

# 「学习中」状态：T1 前两章已完成，有小测分
PROGRESS_THEORY = {
    "state": {
        "progress": {
            "completedChapters": ["t1-combinatorics", "t1-outs"],
            "quizScores": {"t1-combinatorics": 90, "t1-outs": 70},
            "currentChapter": None,
            "startedAt": 1700000000000,
            "flaggedQuestions": [],
            "activeVariant": "standard",
            "variantMetadata": {
                "standard": {"lastViewedAt": 1700000000000, "preferredOrder": 0},
                "short-deck": {"lastViewedAt": 0, "preferredOrder": 1},
                "heads-up": {"lastViewedAt": 0, "preferredOrder": 2},
            },
        },
    },
    "version": 3,
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, viewport, inject=None):
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
        page.goto(f"{BASE}/theory", wait_until="networkidle")
        page.wait_for_timeout(1200)
        if inject is not None:
            page.evaluate(
                f"localStorage.setItem('theory-academy-progress', JSON.stringify({json.dumps(inject)}))"
            )
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
        debug = page.evaluate(
            "() => ({ head: (document.querySelector('.theory-hero')?.innerText || '').replace(/\\n/g,' | ').slice(0,160), ladderT1: (document.querySelector('.level-row-head')?.innerText || '').replace(/\\n/g,' | ').slice(0,120) })"
        )
        print(f"[{label}] hero:", debug.get('head'))
        print(f"[{label}] T1   :", debug.get('ladderT1'))
        out_path = os.path.join(OUT, f"theory-{label}.png")
        page.screenshot(path=out_path, full_page=True)
        print(f"[{label}] saved {out_path} errors:", errors[:5] if errors else "none")
        ctx.close()

    capture("desktop-fresh", {"width": 1440, "height": 2200})
    capture("mobile-fresh", {"width": 390, "height": 2000})
    capture("desktop-progress", {"width": 1440, "height": 2200}, inject=PROGRESS_THEORY)
    capture("mobile-progress", {"width": 390, "height": 2000}, inject=PROGRESS_THEORY)

    browser.close()

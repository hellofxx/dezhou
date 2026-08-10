import os
import json
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou/.visual-check"
BASE = "http://localhost:5173/dezhou"

# 注入「学习中」状态到 strategy-academy-progress localStorage（版本 5）
MID_PROGRESS_ACADEMY = {
    "state": {
        "basicsProgress": {
            "completed": True,
            "currentStep": 5,
            "completedAt": 1700000000000,
        },
        "progress": {
            "startedAt": 1700000000000,
            "currentLesson": None,
            "completedLessons": [
                "l1-basics",
                "l1-position",
                "l1-hand-selection",
            ],
            "quizScores": {},
            "completedUnits": {},
        },
    },
    "version": 5,
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, viewport, init_progress=None):
        ctx = browser.new_context(viewport=viewport, locale="zh-CN")
        page = ctx.new_page()
        errors = []
        not_found = []
        page.on("response", lambda r: not_found.append(r.url) if r.status == 404 else None)
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))
        # 首次访问须先过 onboarding 门禁
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(600)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=4000)
            page.wait_for_timeout(400)
        except Exception:
            pass
        page.goto(f"{BASE}/academy", wait_until="networkidle")
        page.wait_for_timeout(1200)
        # 注入「学习中」状态后刷新，使 persist 重新水合
        if init_progress is not None:
            page.evaluate(f"localStorage.setItem('strategy-academy-progress', JSON.stringify({json.dumps(init_progress)}))")
            page.reload(wait_until="networkidle")
            page.wait_for_timeout(1200)
        # 调试：打印关键 localStorage 与首个等级行可见文字
        debug = page.evaluate("""() => ({
            academy: localStorage.getItem('strategy-academy-progress'),
            l1Text: (document.querySelector('.level-row .level-row-head')?.innerText || '').slice(0, 160),
        })""")
        print(f"[{label}] academy:", (debug.get('academy') or 'null')[:180])
        print(f"[{label}] L1     :", debug.get('l1Text').replace('\\n', ' | '))
        out_path = os.path.join(OUT, f"academy-{label}.png")
        page.screenshot(path=out_path, full_page=True)
        print(f"[{label}] saved {out_path} errors:", errors[:5] if errors else "none")
        if not_found:
            print(f"[{label}] 404 urls:", list(set(not_found)))
        ctx.close()

    # 全新用户（fresh）
    capture("desktop-fresh", {"width": 1440, "height": 2200})
    capture("mobile-fresh", {"width": 390, "height": 2000})

    # 学习中状态（mid-progress）
    capture("desktop-progress", {"width": 1440, "height": 2200}, init_progress=MID_PROGRESS_ACADEMY)
    capture("mobile-progress", {"width": 390, "height": 2000}, init_progress=MID_PROGRESS_ACADEMY)

    browser.close()
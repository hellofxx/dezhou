import os
import json
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\24533\Desktop\dezhou/.visual-check"
BASE = "http://localhost:5173/dezhou"

now = int(time.time() * 1000)
DAY = 24 * 3600 * 1000
today_str = "2026-08-10"

modules = ["range-trainer", "pot-odds", "gto-simulator"]
records = []
for i in range(14):
    ts = now - (13 - i) * DAY + 3600 * 1000
    for j in range(1 + (i % 3)):
        total = 15 + (i * 7 + j * 3) % 15
        acc = min(0.94, 0.55 + 0.028 * i + 0.02 * j)
        correct = int(round(total * acc))
        records.append({
            "id": f"rec-{i}-{j}",
            "module": modules[(i + j) % 3],
            "mode": "quiz",
            "result": {
                "sessionId": f"sess-{i}-{j}",
                "module": modules[(i + j) % 3],
                "totalQuestions": total,
                "correctAnswers": correct,
                "accuracy": round(correct / total, 4),
                "averageTime": (7 + (i + j) % 9) * 1000,
                "timestamp": ts,
                "details": [],
                "lastQuestionCorrect": True,
            },
            "createdAt": ts,
        })

PROGRESS_STATE = {
    "state": {
        "records": records,
        "elo": {
            "overall": 1720, "preflop": 1580, "postflop": 1650,
            "math": 1800, "handReading": 1740, "mental": 1830,
            "kFactor": 24, "gamesPlayed": 128, "lastUpdated": now,
        },
        "streak": {
            "currentStreak": 12, "longestStreak": 28,
            "lastTrainingDate": today_str, "streakFreezes": 2,
            "streakFreezeUsedToday": False,
            "milestones": {"day3": True, "day7": True, "day30": False,
                           "day100": False, "day365": False},
            "lastMilestoneCelebrated": 7, "streakStartDate": "2026-07-30",
            "streakBrokenAt": None,
        },
        "onboarding": {"completed": True, "currentStep": 5, "completedAt": now},
        "settings": {
            "theme": "dark", "soundEnabled": True,
            "defaultQuizTime": 15, "defaultQuestionCount": 20,
            "language": "zh",
        },
    },
    "version": 10,
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    def capture(label, viewport):
        ctx = browser.new_context(viewport=viewport, locale="zh-CN")
        page = ctx.new_page()
        errors = []
        page.on("response", lambda r: None if r.status != 404 else None)
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))
        page.goto(f"{BASE}/onboarding", wait_until="networkidle")
        page.wait_for_timeout(600)
        try:
            page.get_by_text("跳过引导", exact=True).click(timeout=4000)
            page.wait_for_timeout(400)
        except Exception:
            pass
        page.goto(f"{BASE}/progress", wait_until="networkidle")
        page.wait_for_timeout(1000)
        # 注入进度数据后刷新，使 persist 重新水合
        page.evaluate(f"localStorage.setItem('poker-training-progress', JSON.stringify({json.dumps(PROGRESS_STATE)}))")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1400)
        debug = page.evaluate("""() => ({
            plaque: (document.querySelector('.rp-plaque')?.innerText || '').replace(/\\n/g, ' | '),
            metricLabels: Array.from(document.querySelectorAll('.rp-metric-label')).map(e => e.textContent).join(', '),
            metricValues: Array.from(document.querySelectorAll('.rp-metric-value')).map(e => e.textContent).join(', '),
        })""")
        print(f"[{label}] plaque    :", debug.get('plaque'))
        print(f"[{label}] metrics   :", debug.get('metricLabels'))
        print(f"[{label}] values    :", debug.get('metricValues'))
        page.screenshot(path=os.path.join(OUT, f"progress-{label}.png"), full_page=True)
        print(f"[{label}] saved.")
        ctx.close()

    capture("desktop", {"width": 1280, "height": 720})
    capture("laptop", {"width": 1024, "height": 720})
    capture("mobile", {"width": 390, "height": 2200})

    browser.close()

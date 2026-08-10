"""
截图：每日谜题答题页（重构后）桌面 + 移动两个尺寸。

通过预先写入 localStorage (poker-training-progress) 跳过 onboarding gate。
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5174/dezhou"
OUT_DIR = ".visual-check"

DESKTOP = {"width": 1440, "height": 900}
MOBILE = {"width": 390, "height": 844}

# 预先写入 zustand persist 的 onboarding 完成状态：
# poker-training-progress → state.onboarding.completed = true
# 字段顺序必须符合 store.partialize 输出（id 通常为 version）。
ONBOARDING_PAYLOAD = {
    "state": {
        "onboarding": {"completed": True, "currentStepId": None, "skippedSteps": []},
    },
    "version": 0,
}
PAYLOAD_JSON = json.dumps(ONBOARDING_PAYLOAD, separators=(",", ":"))


def inject_onboarding_skip(context):
    """在每个新页面加载前注入 localStorage，跳过 onboarding gate"""
    context.add_init_script(
        f"""
        window.localStorage.setItem('poker-training-progress', {json.dumps(PAYLOAD_JSON)});
        """
    )


def shoot(page, name: str) -> None:
    out = f"{OUT_DIR}/{name}.png"
    page.screenshot(path=out, full_page=False)
    print(f"  saved {out}")


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for tag, viewport in (("desktop", DESKTOP), ("mobile", MOBILE)):
            ctx = browser.new_context(viewport=viewport, device_scale_factor=1.5)
            inject_onboarding_skip(ctx)
            page = ctx.new_page()
            url = f"{BASE}/puzzle/daily"
            print(f"[{tag}] visiting {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=15000)
            try:
                page.wait_for_selector(".action-tile", timeout=8000)
            except Exception as e:
                print(f"  warn: .action-tile not ready ({e}); will screenshot whatever is on page")
            page.wait_for_timeout(800)
            print(f"  final URL: {page.url}")
            shoot(page, f"daily-redesign-{tag}")
            ctx.close()
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

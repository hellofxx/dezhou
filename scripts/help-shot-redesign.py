"""Capture redesigned Help Center screenshots (desktop + mobile)."""

import json
from playwright.sync_api import sync_playwright

INIT_STATE = {
    'state': {
        'onboarding': {
            'completed': True,
            'currentStep': 5,
            'startedAt': 1700000000000,
            'completedAt': 1700000000000,
            'initialAbility': {
                'selfRating': 'beginner',
                'hasPlayedOnline': False,
            },
        }
    },
    'version': 10,
}
INIT_STR = json.dumps(INIT_STATE, ensure_ascii=False)
SETUP_JS = (
    "window.localStorage.setItem("
    "'poker-training-progress', " + json.dumps(INIT_STR) + ");"
)


def grab(url, viewport, desktop_path, mobile_path):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        ctx = browser.new_context(viewport=viewport, locale='zh-CN')
        ctx.add_init_script(SETUP_JS)
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle')
        page.wait_for_timeout(1500)
        page.screenshot(path=desktop_path, full_page=True)
        ctx.close()

        # FAQ 展开态截图
        ctx2 = browser.new_context(viewport=viewport, locale='zh-CN')
        ctx2.add_init_script(SETUP_JS)
        page2 = ctx2.new_page()
        page2.goto(url, wait_until='networkidle')
        page2.wait_for_timeout(1500)
        # 展开第一个 FAQ
        try:
            page2.locator('button.faq-item-button').first.click()
            page2.wait_for_timeout(500)
            page2.locator('button.faq-item-button').nth(2).click()
            page2.wait_for_timeout(500)
        except Exception as e:
            print(f'FAQ expand step skipped: {e}')
        page2.screenshot(path=mobile_path, full_page=True)
        ctx2.close()

        browser.close()


if __name__ == '__main__':
    grab(
        'http://localhost:5173/dezhou/help',
        {'width': 1440, 'height': 1000},
        '.visual-check/help-redesign-desktop.png',
        '.visual-check/help-redesign-desktop-faq-open.png',
    )
    grab(
        'http://localhost:5173/dezhou/help',
        {'width': 390, 'height': 844},
        '.visual-check/help-redesign-mobile.png',
        '.visual-check/help-redesign-mobile-faq-open.png',
    )
    print('done')
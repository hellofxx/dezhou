from playwright.sync_api import sync_playwright
import json

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

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    ctx = browser.new_context(viewport={'width': 1440, 'height': 1000})
    ctx.add_init_script(SETUP_JS)
    page = ctx.new_page()
    page.goto('http://localhost:5173/dezhou/help', wait_until='networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path='.visual-check/help-current-desktop.png', full_page=True)
    ctx.close()

    ctx2 = browser.new_context(viewport={'width': 390, 'height': 844})
    ctx2.add_init_script(SETUP_JS)
    page2 = ctx2.new_page()
    page2.goto('http://localhost:5173/dezhou/help', wait_until='networkidle')
    page2.wait_for_timeout(1500)
    page2.screenshot(path='.visual-check/help-current-mobile.png', full_page=True)
    ctx2.close()

    browser.close()

print('done')
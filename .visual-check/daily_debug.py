"""
调试：打印 daily 页面 DOM 概览，以判断 gate/redirect 来源
"""
from playwright.sync_api import sync_playwright

URL = "http://localhost:5174/dezhou/puzzle/daily"

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=15000)
    page.wait_for_timeout(3000)
    # 截图看看什么状态
    page.screenshot(path=".visual-check/daily-debug.png", full_page=True)
    print("URL after load:", page.url)
    print("body children:", page.evaluate("() => document.body.children.length"))
    print("first 2KB of body innerHTML:")
    print(page.evaluate("() => document.body.innerHTML.substring(0, 2000)"))
    browser.close()

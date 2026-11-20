import { expect, type Page } from '@playwright/test';

/** 应用部署在 `/dezhou/` 子路径（vite base + router basename），所有路径必须带前缀 */
export const APP_ROOT = '/dezhou/';

/** 引导页路由 */
export const ONBOARDING_URL = /\/dezhou\/onboarding$/;

/** 首页路由（`/dezhou/`） */
export const HOME_URL = /\/dezhou\/$/;

/**
 * 通过真实 UI 跳过新手引导。
 *
 * 首次访问任意 AppLayout 页面都会被 `OnboardingGate` 重定向到 `/onboarding`；
 * WelcomeStep 的「跳过引导」按钮是产品提供的真实出口（不做 localStorage / store 直写）。
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.goto(APP_ROOT);
  await expect(page).toHaveURL(ONBOARDING_URL);
  await page.getByRole('button', { name: '跳过引导' }).click();
  await expect(page).toHaveURL(HOME_URL);
}

/**
 * 侧边栏导航（桌面视口）。导航项 aria-label 即模块名文案，避免依赖 DOM 层级。
 */
export async function navigateFromSidebar(page: Page, moduleName: string): Promise<void> {
  // 限定在侧边栏内：移动端底部导航（<768px 才显示）有同名链接，同名会触发 strict mode
  await page.locator('aside').getByRole('link', { name: moduleName }).click();
}

/**
 * 关闭答题过程中可能弹出的全局模态（Tilt 提醒）。
 *
 * 连续答错 3 题会触发 Tilt Dialog，焦点被 Radix 焦点陷阱移入对话框，
 * 此时训练页的 Space / Esc 快捷键会主动让位给对话框。这里用 Esc 关闭并等它消失，
 * 不修改任何训练状态（不跳转、不结束会话）。
 */
export async function dismissGlobalDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible()) {
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  }
}

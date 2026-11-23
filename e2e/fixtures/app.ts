import { expect, type Page } from '@playwright/test';

/** 应用部署在 `/dezhou/` 子路径（vite base + router basename），所有路径必须带前缀 */
export const APP_ROOT = '/dezhou/';

/** 引导页路由 */
export const ONBOARDING_URL = /\/dezhou\/onboarding$/;

/** 学习路径首页（`/dezhou/`） */
export const HOME_URL = /\/dezhou\/$/;

/**
 * 冻结 IA 的主路由出口（批次 3）。
 *
 * 会话 / 深链路由（`/range-trainer/quiz`、`/gto-simulator/session/:id` 等）不在此列出：
 * 它们由各自用例按真实入口进入，避免在夹具里维护第二份路由清单。
 */
export const ROUTES = {
  learningPath: '/',
  lesson: '/lesson',
  drill: '/drill',
  quick: '/quick',
  progress: '/progress',
  help: '/help',
  settings: '/settings',
} as const;

/** 冻结 IA：侧栏 6 项文案（设置走顶栏齿轮，不占侧栏一项） */
export const SIDEBAR_ITEMS = ['学习路径', '课程', '训练', '速训', '进度中心', '帮助中心'] as const;

/** 冻结 IA：移动底栏 5 项文案（训练直达 `/drill`，帮助走顶栏按钮） */
export const MOBILE_NAV_ITEMS = ['学习路径', '课程', '训练', '速训', '进度中心'] as const;

/**
 * 课程 01 组（主线枢纽 + 两张地图）的壳层页名。
 *
 * `/lesson` 是唯一课程主线（返回目标恒为它）；`/academy` 与 `/theory` 是地图，
 * 地图根只做「返回课程目录」而不承担主线职责（见 docs/COURSE_IA.md R2 / R8）。
 */
export const COURSE_GROUP = [
  { path: '/lesson', heading: '课程' },
  { path: '/academy', heading: '实战地图' },
  { path: '/theory', heading: '理论地图' },
] as const;

/** 地图根与执行页返回课程主线的文案（`nav.backToCourseHub`） */
export const BACK_TO_COURSE_HUB = '返回课程目录';

/**
 * 桌面侧栏主导航（`<nav aria-label="主导航">`，<768px 隐藏）。
 *
 * 限定在 `role=navigation` 内，避免与移动底栏（`移动端导航`）同名项撞车。
 */
export function sidebarNav(page: Page) {
  return page.getByRole('navigation', { name: '主导航' });
}

/** 移动端底栏（`<nav aria-label="移动端导航">`，≥768px 隐藏） */
export function mobileNav(page: Page) {
  return page.getByRole('navigation', { name: '移动端导航' });
}

/**
 * 顶栏图标入口（设置齿轮 / 帮助中心）。
 *
 * AppLayout 顶栏是页面级 `<header>`（banner），桌面端帮助与移动端设置齿轮都挂在这里；
 * 按 aria-label 点击，不依赖图标实现。
 */
export async function openFromTopBar(page: Page, actionName: string): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: actionName, exact: true }).click();
}

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

/** 侧栏导航（桌面视口）：按冻结 IA 文案点击，落点断言由调用方负责 */
export async function navigateFromSidebar(page: Page, itemName: string): Promise<void> {
  await sidebarNav(page).getByRole('link', { name: itemName, exact: true }).click();
}

/** 移动底栏导航（<768px）：按冻结 IA 文案点击 */
export async function navigateFromMobileNav(page: Page, itemName: string): Promise<void> {
  await mobileNav(page).getByRole('link', { name: itemName, exact: true }).click();
}

/** 断言整页 h1（外壳页名，全站唯一一级标题） */
export async function expectPageHeading(page: Page, name: string | RegExp): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
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

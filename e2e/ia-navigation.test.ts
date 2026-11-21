import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import {
  APP_ROOT,
  SIDEBAR_ITEMS,
  expectPageHeading,
  navigateFromSidebar,
  sidebarNav,
  skipOnboarding,
} from './fixtures/app';

/**
 * 冻结 IA 导航门禁（桌面 1440×900）。
 *
 * 覆盖三件事：
 * 1. 侧栏 6 项文案与落点、5 条主路由的 h1（`/lesson` 自动跳下一课）；
 * 2. 旧训练入口 `/range-trainer` `/pot-odds` `/puzzle` → 二级站 `/drill/range|odds|puzzle`；
 * 3. 训练场 → 手牌范围训练 → 浏览器返回键回到训练场（SPA 历史栈语义）。
 *
 * 全部走真实 UI：不做 localStorage / store 直写，等待一律交给 expect 自动重试。
 */
test.use({ viewport: { width: 1440, height: 900 } });

/** 旧训练入口 → 二级站首页 */
const LEGACY_REDIRECTS = [
  { legacy: 'range-trainer', path: /\/dezhou\/drill\/range$/, heading: '范围训练' },
  { legacy: 'pot-odds', path: /\/dezhou\/drill\/odds$/, heading: '赔率训练' },
  { legacy: 'puzzle', path: /\/dezhou\/drill\/puzzle$/, heading: '谜题训练' },
] as const;

/** 侧栏项 → 落点与 h1（「课程」走 `/lesson` 自动跳下一课，单独断言） */
const SIDEBAR_ROUTES = [
  { item: '学习路径', path: /\/dezhou\/$/, heading: '学习路径' },
  { item: '训练', path: /\/dezhou\/drill$/, heading: '训练场' },
  { item: '速训', path: /\/dezhou\/quick$/, heading: '速训' },
  { item: '进度中心', path: /\/dezhou\/progress$/, heading: '进度中心' },
  { item: '帮助中心', path: /\/dezhou\/help$/, heading: '帮助中心' },
] as const;

test('侧栏 6 项文案与落点正确，主路由 h1 正确（/lesson 进入课程枢纽）', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  // 侧栏 6 项（设置走顶栏齿轮，不占侧栏一项）
  await expect(sidebarNav(page)).toBeVisible();
  await expect(sidebarNav(page).getByRole('link')).toHaveCount(SIDEBAR_ITEMS.length);
  for (const item of SIDEBAR_ITEMS) {
    await expect(sidebarNav(page).getByRole('link', { name: item, exact: true })).toBeVisible();
  }

  // 学习路径（`/`）
  await expect(page).toHaveURL(/\/dezhou\/$/);
  await expectPageHeading(page, '学习路径');

  // 课程：进入课程枢纽；新用户看到基础入门 CTA，不自动跳走
  await navigateFromSidebar(page, '课程');
  await expect(page).toHaveURL(/\/dezhou\/lesson$/);
  await expectPageHeading(page, '课程');
  await expect(page.getByRole('main').getByRole('link', { name: '去基础入门' })).toBeVisible();

  // 其余主路由：侧栏点击 → 落点 + h1
  for (const route of SIDEBAR_ROUTES) {
    await navigateFromSidebar(page, route.item);
    await expect(page).toHaveURL(route.path);
    await expectPageHeading(page, route.heading);
  }

  guard.assertClean();
});

test('旧训练入口 3 条重定向到二级站，落点 h1 正确', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  for (const { legacy, path, heading } of LEGACY_REDIRECTS) {
    await page.goto(`${APP_ROOT}${legacy}`);
    await expect(page).toHaveURL(path);
    await expectPageHeading(page, heading);
  }

  guard.assertClean();
});

test('训练场 → 范围站 → 测验，浏览器返回键逐级回退', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}drill`);
  await expect(page).toHaveURL(/\/dezhou\/drill$/);
  await expectPageHeading(page, '训练场');

  // 卡片名以「范围训练」起头（副文案可选，不锁死完整名称）
  await page.getByRole('main').getByRole('link', { name: /^范围训练/ }).click();
  await expect(page).toHaveURL(/\/dezhou\/drill\/range$/);
  await expectPageHeading(page, '范围训练');

  await page.getByRole('button', { name: '测验模式' }).click();
  await expect(page).toHaveURL(/\/dezhou\/range-trainer\/quiz$/);
  await expectPageHeading(page, '训练');

  await page.goBack();
  await expect(page).toHaveURL(/\/dezhou\/drill\/range$/);
  await expectPageHeading(page, '范围训练');

  await page.goBack();
  await expect(page).toHaveURL(/\/dezhou\/drill$/);
  await expectPageHeading(page, '训练场');

  guard.assertClean();
});

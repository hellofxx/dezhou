import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import {
  APP_ROOT,
  BACK_TO_COURSE_HUB,
  expectPageHeading,
  navigateFromSidebar,
  skipOnboarding,
} from './fixtures/app';

/**
 * 课程枢纽（v1.13）：/lesson 不再自动跳下一课。
 * 新用户应看到「先完成基础入门」与阶段路径，而不是被重定向；
 * 双泳道阶段卡的概念/实战链接与目录入口都在真实浏览器中可达。
 */
test.use({ viewport: { width: 1440, height: 900 } });

test('课程侧栏进入枢纽，新用户看到基础入门 CTA 与阶段路径', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await navigateFromSidebar(page, '课程');
  await expect(page).toHaveURL(/\/dezhou\/lesson$/);
  await expectPageHeading(page, '课程');

  await expect(page.getByRole('main').getByRole('link', { name: '去基础入门' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('heading', { level: 2, name: '阶段路径' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: '实战地图' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: '理论地图' })).toBeVisible();

  guard.assertClean();
});

test('枢纽 → 章节 → 返回课程目录：回到主线并回位阶段锚点', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}lesson`);
  await expectPageHeading(page, '课程');

  // 新用户点 L1 实战 chip 会先被基础入门接管；概念泳道 T1 默认解锁，
  // 同样携带 stageIndex 来源，且面包屑返回是真实按钮。
  const firstStage = page.locator('[data-hub-stage]').first();
  const stageIndex = await firstStage.getAttribute('data-hub-stage');
  expect(stageIndex).toBeTruthy();

  const conceptChip = firstStage.locator('a[href*="/theory/chapter/"]').first();
  await expect(conceptChip).toBeVisible();
  await conceptChip.click();
  await expect(page).toHaveURL(/\/dezhou\/theory\/chapter\/[^?#]+$/);

  // 执行页返回：来源感知 → 课程主线 + #hub-stage-N 锚点回位
  await page.getByRole('button', { name: BACK_TO_COURSE_HUB }).first().click();
  await expect(page).toHaveURL(new RegExp(`/dezhou/lesson#hub-stage-${stageIndex}$`));
  await expectPageHeading(page, '课程');

  guard.assertClean();
});

test('阶段卡闭环步骤③进入实战地图评估区，并可按 R3 返回主线', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}lesson`);
  await expectPageHeading(page, '课程');

  const checkLink = page.locator('[data-hub-stage] a[href$="#assessment"]').first();
  await expect(checkLink).toBeVisible();
  await checkLink.click();

  await expect(page).toHaveURL(/\/dezhou\/academy#assessment$/);
  await expectPageHeading(page, '实战地图');
  await expect(page.getByRole('main').getByRole('region', { name: '评估' })).toBeVisible();

  await page.getByRole('main').getByRole('link', { name: '返回课程目录' }).click();
  await expect(page).toHaveURL(/\/dezhou\/lesson$/);

  guard.assertClean();
});

test('实战地图学习工具默认折叠，展开后工具入口可达', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}academy`);
  await expectPageHeading(page, '实战地图');

  const summary = page.locator('#academy-tools > summary');
  await expect(summary).toBeVisible();
  await expect(page.getByText('5 分钟速训')).toBeHidden();

  await summary.click();
  await expect(page.getByText('5 分钟速训')).toBeVisible();

  guard.assertClean();
});

test('基础入门页仍可从枢纽进入，旧课时深链不受影响', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}lesson`);
  await expectPageHeading(page, '课程');
  await page.getByRole('main').getByRole('link', { name: '去基础入门' }).click();
  await expect(page).toHaveURL(/\/dezhou\/academy\/basics$/);

  guard.assertClean();
});

test('枢纽切换变体：两张地图只读同步且无本地切换控件', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}lesson`);
  await expectPageHeading(page, '课程');

  // 主线是唯一 canonical 切换入口
  await page.getByRole('main').getByRole('button', { name: '单挑' }).first().click();

  // 理论地图：只读显示“单挑”，不再有分段切换控件
  await page.goto(`${APP_ROOT}theory`);
  await expectPageHeading(page, '理论地图');
  await expect(page.getByRole('main').getByText('单挑').first()).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: '在课程目录切换' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('group', { name: '选择游戏变体' })).toHaveCount(0);

  // 实战地图：同样只读同步
  await page.goto(`${APP_ROOT}academy`);
  await expectPageHeading(page, '实战地图');
  await expect(page.getByRole('main').getByText('单挑').first()).toBeVisible();
  await expect(page.getByRole('main').getByRole('link', { name: '在课程目录切换' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('group', { name: '选择游戏变体' })).toHaveCount(0);

  guard.assertClean();
});
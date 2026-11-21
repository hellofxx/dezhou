import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { APP_ROOT, expectPageHeading, navigateFromSidebar, skipOnboarding } from './fixtures/app';

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
  await expect(page.getByRole('main').getByRole('link', { name: /全部策略课程/ })).toBeVisible();

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
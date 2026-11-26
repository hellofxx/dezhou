import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { APP_ROOT, expectPageHeading, skipOnboarding } from './fixtures/app';

test('帮助中心全文检索可命中文章正文并打开教程', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);
  await page.goto(`${APP_ROOT}help`);
  await expectPageHeading(page, '帮助中心');

  const search = page.getByRole('searchbox', { name: '搜索帮助内容' });
  await search.fill('冻结 导出');
  await expect(page.locator('.help-search-status')).toHaveText('找到 1 条匹配内容');

  const article = page.getByRole('link', { name: /^设置与数据管理/ });
  await expect(article).toBeVisible();
  await article.click();
  await expect(page).toHaveURL(/\/dezhou\/help\/article\/settings$/);
  await expect(page.getByRole('heading', { level: 2, name: '设置与数据管理' })).toBeVisible();
  await expect(page.getByRole('link', { name: '上一篇：进度统计' })).toBeVisible();

  guard.assertClean();
});

test('帮助中心锚点移动焦点，FAQ 检索与 Escape 清除可用', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);
  await page.goto(`${APP_ROOT}help`);

  await page.getByRole('link', { name: '从快速上手开始' }).click();
  await expect(page.locator('#help-quickstart')).toBeFocused();

  const search = page.getByRole('searchbox', { name: '搜索帮助内容' });
  await search.fill('每日谜题会联网');
  const question = page.getByRole('button', { name: /每日谜题会联网或生成全球排名吗/ });
  await expect(question).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('region', { name: /每日谜题会联网或生成全球排名吗/ }))
    .toContainText('没有账号、服务器排行榜或数据上传');

  await search.press('Escape');
  await expect(search).toHaveValue('');
  await expect(page.locator('.module-card')).toHaveCount(11);

  guard.assertClean();
});

test('移动端帮助中心检索不产生横向溢出', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await skipOnboarding(page);
  await page.goto(`${APP_ROOT}help`);

  const search = page.getByRole('searchbox', { name: '搜索帮助内容' });
  await expect(search).toBeVisible();
  await search.fill('GTO');
  await expect(page.locator('.module-card').first()).toBeVisible();

  const hasOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > window.innerWidth
  ));
  expect(hasOverflow).toBe(false);

  guard.assertClean();
});

import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { APP_ROOT, expectPageHeading, skipOnboarding } from './fixtures/app';

/**
 * 恢复的二级深链（v1.12.0）。
 *
 * 直接输入 URL 验证「收编时撤掉的学院/理论工具页」真实可达，且壳层 h1
 * 与 navSections 页名一致；用真实页面而非路由表断言，防止再次静默 404。
 */
test.use({ viewport: { width: 1440, height: 900 } });

const RESTORED_ROUTES: { path: string; heading: string }[] = [
  { path: 'drill/range', heading: '范围训练' },
  { path: 'drill/odds', heading: '赔率训练' },
  { path: 'drill/puzzle', heading: '谜题训练' },
  { path: 'academy/tracks', heading: '学习轨道' },
  { path: 'academy/concept-graph', heading: '知识图谱' },
  { path: 'academy/search', heading: '课程搜索' },
  { path: 'academy/placement', heading: '定位测评' },
  { path: 'academy/bookmarks', heading: '我的收藏' },
  { path: 'academy/bibliography', heading: '参考书目' },
  { path: 'theory/placement', heading: '理论定位' },
  { path: 'theory/glossary', heading: '理论术语' },
  { path: 'theory/search', heading: '理论搜索' },
  { path: 'theory/bibliography', heading: '理论书目' },
];

test('恢复的二级深链全部真实可达且页名正确', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  for (const route of RESTORED_ROUTES) {
    await page.goto(`${APP_ROOT}${route.path}`);
    await expectPageHeading(page, route.heading);
  }

  guard.assertClean();
});

test('学习轨道保留 ?track= 深链语义', async ({ page }) => {
  const guard = guardBrowserErrors(page);
  await skipOnboarding(page);

  await page.goto(`${APP_ROOT}academy/tracks?track=track-beginner`);
  await expect(page).toHaveURL(/\/dezhou\/academy\/tracks\?track=track-beginner$/);
  await expectPageHeading(page, '学习轨道');

  guard.assertClean();
});

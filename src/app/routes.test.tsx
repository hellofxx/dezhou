import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import i18n from '@/i18n/config';
import { useProgressStore } from '@/features/progress/store';
import { appRoutes, router } from './routes';

/**
 * 路由组合冒烟（批次 3 冻结路由表）：
 * - 结构层锁定 AppLayout / BlankLayout 两个分支的路径清单、路径唯一性、动态参数与 LazyWrapper 包裹；
 * - 渲染层用 /help（纯静态页面）验证「壳层 + 新手门禁 + 懒加载页面」的接线。
 *
 * 新增 / 删除路由必须同步本清单；这是路由注册的事实快照，避免路径被误删后静默 404。
 */

const APP_LAYOUT_PATHS = [
  '(index)',
  'lesson/:lessonId',
  'lesson',
  'drill',
  'drill/range',
  'drill/odds',
  'drill/puzzle',
  'quick',
  'progress',
  'progress/range',
  'progress/gto',
  'leaderboard',
  'settings',
  'help',
  'help/article/:articleId',
  'academy',
  'academy/basics',
  'academy/tracks',
  'academy/concept-graph',
  'academy/search',
  'academy/placement',
  'academy/checkpoint/:level',
  'academy/certification/:level',
  'academy/bookmarks',
  'academy/bibliography',
  'gto-simulator',
  'gto-simulator/result/:sessionId',
  'hand-history',
  'hand-history/import',
  'theory',
  'theory/chapter/:chapterId',
  'theory/review',
  'theory/placement',
  'theory/checkpoint/:levelId',
  'theory/glossary',
  'theory/search',
  'theory/bibliography',
  'puzzle/rush',
  'puzzle/daily',
  'puzzle/theme/:themeId',
  // 旧深链重定向（保留 query）
  'academy/lesson/:lessonId',
  'academy/quick-drill',
  'range-trainer',
  'pot-odds',
  'puzzle',
];

const BLANK_LAYOUT_PATHS = [
  'onboarding',
  'range-trainer/learn',
  'range-trainer/quiz',
  'pot-odds/quiz',
  'gto-simulator/session/:scenarioId',
  'hand-history/:handId',
];

function routePath(route: RouteObject): string {
  return route.index ? '(index)' : (route.path ?? '(layout)');
}

const appLayoutRoute = appRoutes.find((route) => route.path === '/');
const blankLayoutRoute = appRoutes.find(
  (route) => route.path === undefined && route.children !== undefined,
);

describe('路由注册结构', () => {
  it('根路由只包含 AppLayout 与 BlankLayout 两个分支', () => {
    expect(appRoutes).toHaveLength(2);
    expect(appLayoutRoute?.element).toBeTruthy();
    expect(blankLayoutRoute?.element).toBeTruthy();
  });

  it('AppLayout 分支的路径清单与预期一致', () => {
    expect(appLayoutRoute?.children?.map(routePath)).toEqual(APP_LAYOUT_PATHS);
  });

  it('BlankLayout 分支的路径清单与预期一致', () => {
    expect(blankLayoutRoute?.children?.map(routePath)).toEqual(BLANK_LAYOUT_PATHS);
  });

  it('所有叶子路由都有 element，且经 LazyWrapper 包裹', () => {
    const leaves = [...(appLayoutRoute?.children ?? []), ...(blankLayoutRoute?.children ?? [])];
    const violations = leaves
      .filter((route) => {
        const element = route.element as { type?: { name?: string } } | undefined;
        return !element || element.type?.name !== 'LazyWrapper';
      })
      .map(routePath);

    expect(violations).toEqual([]);
  });

  it('收编时撤掉的二级页面已全部恢复注册', () => {
    const paths = (appLayoutRoute?.children ?? []).map((route) => route.path);
    for (const restored of [
      'drill/range',
      'drill/odds',
      'drill/puzzle',
      'academy/tracks',
      'academy/concept-graph',
      'academy/search',
      'academy/placement',
      'academy/checkpoint/:level',
      'academy/bookmarks',
      'academy/bibliography',
      'academy/certification/:level',
      'theory/placement',
      'theory/checkpoint/:levelId',
      'theory/glossary',
      'theory/search',
      'theory/bibliography',
    ]) {
      expect(paths, `恢复路由未注册：${restored}`).toContain(restored);
    }
  });

  it('路径无重复，动态参数路由齐全', () => {
    const paths = [...(appLayoutRoute?.children ?? []), ...(blankLayoutRoute?.children ?? [])]
      .map((route) => route.path)
      .filter((path): path is string => Boolean(path));

    expect(new Set(paths).size).toBe(paths.length);

    for (const param of [
      'sessionId',
      'handId',
      'scenarioId',
      'lessonId',
      'chapterId',
      'level',
      'levelId',
      'themeId',
      'articleId',
    ]) {
      expect(paths.some((path) => path.includes(`:${param}`)), `缺少动态参数 :${param}`).toBe(true);
    }
  });

  it('browser router 复用 Vite base 作为 basename', () => {
    expect(router.basename).toBe(import.meta.env.BASE_URL);
  });
});

describe('路由渲染冒烟', () => {
  afterEach(() => cleanup());

  it('/help 命中 AppLayout 壳层并渲染 HelpHome', { timeout: 20000 }, async () => {
    useProgressStore.setState((state) => ({
      onboarding: { ...state.onboarding, completed: true },
    }));

    const memoryRouter = createMemoryRouter(appRoutes, { initialEntries: ['/help'] });
    render(<RouterProvider router={memoryRouter} />);

    // 壳层 h1 唯一；Help 内容标题按新规范降为 h2
    expect(await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })).toBeTruthy();
    const helpHeading = await screen.findByRole(
      'heading',
      { level: 2, name: '欢迎来到牌室' },
      { timeout: 5000 },
    );
    expect(helpHeading.textContent).toBe('欢迎来到牌室');
    expect(screen.getByRole('link', { name: i18n.t('common.a11y.skipToContent') })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: i18n.t('nav.sidebarNavAria') })).toBeTruthy();
  });
});

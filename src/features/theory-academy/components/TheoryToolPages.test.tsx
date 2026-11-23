/**
 * 恢复的理论工具页路由壳烟测：页面可渲染、返回理论地图的入口存在。
 * 具体内容组件由各自既有测试覆盖；本文件锁路由包装层与返回出口。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';
import TheoryPlacementPage from './TheoryPlacementPage';
import TheoryCheckpointPage from './TheoryCheckpointPage';
import TheoryGlossaryPage from './TheoryGlossaryPage';
import TheorySearchPage from './TheorySearchPage';
import TheoryBibliographyPage from './TheoryBibliographyPage';

afterEach(cleanup);

const CASES = [
  { name: 'placement', path: '/theory/placement', route: '/theory/placement', element: <TheoryPlacementPage /> },
  { name: 'checkpoint', path: '/theory/checkpoint/t1', route: '/theory/checkpoint/:levelId', element: <TheoryCheckpointPage /> },
  { name: 'glossary', path: '/theory/glossary', route: '/theory/glossary', element: <TheoryGlossaryPage /> },
  { name: 'search', path: '/theory/search', route: '/theory/search', element: <TheorySearchPage /> },
  { name: 'bibliography', path: '/theory/bibliography', route: '/theory/bibliography', element: <TheoryBibliographyPage /> },
] as const;

describe('Theory tool page wrappers', () => {
  it.each(CASES)('$name 页面渲染并保留返回理论地图入口', ({ path, route, element }) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(i18n.t('nav.backToTheoryMap')).length).toBeGreaterThan(0);
  });
});

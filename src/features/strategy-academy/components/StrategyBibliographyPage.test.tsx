/**
 * 策略参考书目页契约（jsdom）：
 * - 按 Level 只读聚合渲染（L1-L8 八组），每本书在其标注的每个 Level 各出现一次；
 * - 「返回学院」导航到 /academy，理论学院书目只做外链（/theory/bibliography）；
 * - 页面不发请求、不读写 store（渲染前后 store 快照不变）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';
import StrategyBibliographyPage from './StrategyBibliographyPage';
import { STRATEGY_BIBLIOGRAPHY, groupStrategyBibliographyByLevel } from '../data/bibliography';
import { useAcademyStore } from '../store';

const ACADEMY_PROBE = 'academy-home-probe';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/academy/bibliography']}>
      <Routes>
        <Route path="/academy/bibliography" element={<StrategyBibliographyPage />} />
        <Route path="/academy" element={<div>{ACADEMY_PROBE}</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('StrategyBibliographyPage', () => {
  it('渲染页标题与 L1-L8 八个分组', () => {
    renderPage();

    expect(screen.getByText(i18n.t('academy.bibliography.title'))).toBeTruthy();
    const groups = groupStrategyBibliographyByLevel();
    expect(groups.length).toBe(8);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(groups.length);
  });

  it('每本书在其标注的每个 Level 各出现一次（不丢不重）', () => {
    renderPage();

    for (const entry of STRATEGY_BIBLIOGRAPHY) {
      expect(screen.getAllByText(entry.title), `${entry.id} 出现次数不符`).toHaveLength(
        entry.levels.length,
      );
      expect(screen.getAllByText(entry.author).length).toBeGreaterThanOrEqual(entry.levels.length);
    }
  });

  it('「返回学院」导航到 /academy', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.bibliography.backToAcademy') }));
    expect(screen.getByText(ACADEMY_PROBE)).toBeTruthy();
  });

  it('理论学院书目为外链（/theory/bibliography），不复制其数据', () => {
    renderPage();

    const link = screen.getByRole('link', { name: new RegExp(i18n.t('academy.bibliography.theoryLink')) });
    expect(link.getAttribute('href')).toBe('/theory/bibliography');
  });

  it('只读：渲染不修改学院 store', () => {
    const before = useAcademyStore.getState().progress;
    renderPage();
    expect(useAcademyStore.getState().progress).toEqual(before);
  });
});

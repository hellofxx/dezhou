import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import type { TheoryLevelInfo } from '../types';
import { useTheoryStore } from '../store';
import { TheorySearch } from './TheorySearch';

/**
 * 检索面板契约（jsdom）。
 * 覆盖：目录层命中（章节标题）、术语 / 书目命中、目录层无命中时按需加载全文并命中正文、
 * 完全无结果时的空态文案、共享搜索壳口径（结果行为按钮 + 回调路由 + ARIA 文案不变）。
 *
 * 全文层经 loadTheoryLevelsForVariant 注入（mock），验证「按需 + 一次」的加载时机；
 * 真实 chunk 切分与缓存由 data/levels/loaders 自身测试覆盖。
 * 结果行改由共享 `AcademySearchShell` 渲染为 `<button>`（共享壳不持有路由），
 * 故跳转断言走 useLocation 探针；可访问名仍是「打开 · 标题」。
 */

const fullTextLevel: TheoryLevelInfo = {
  id: 't1',
  level: 1,
  tier: 'basic',
  title: '概率论基础',
  description: '',
  icon: '🎲',
  unlockRequirement: '无',
  practiceRecommendations: { lessons: [] },
  variant: 'standard',
  chapters: [
    {
      id: 't1-outs',
      level: 1,
      order: 2,
      title: 'Outs 与 2/4 法则',
      subtitle: '把机会变成一个百分数',
      duration: '10 min',
      variant: 'standard',
      eloDimension: 'math',
      content: [{ type: 'text', content: '独家令牌：一张牌约 2%，两张牌约 4%。' }],
      quiz: [],
    },
  ],
};

const loadFullText = vi.hoisted(() => vi.fn());

vi.mock('../data/levels/loaders', () => ({
  loadTheoryLevelsForVariant: loadFullText,
  loadTheoryLevelById: vi.fn(),
  getLoadedTheoryLevel: vi.fn(),
  getLoadedTheoryLevels: vi.fn(),
  loadTheoryLevelsForVariants: vi.fn(),
}));

vi.mock('./theoryOptionalSources', () => ({
  getTheoryGlossaryTerms: () => [
    {
      id: 'term-mdf',
      termKey: 'theory.glossary.title',
      definitionKey: 'theory.glossary.subtitle',
      relatedChapterIds: ['t1-combinatorics'],
    },
  ],
  getTheoryBibliographyEntries: () => [
    { id: 'book-mop', titleKey: 'theory.bibliography.title', year: 2006 },
  ],
  getTheoryContentOps: () => ({ lastReviewed: {} }),
  getChapterLastReviewed: () => undefined,
}));

afterEach(() => {
  cleanup();
  loadFullText.mockReset();
  useTheoryStore.setState((state) => ({
    progress: { ...state.progress, activeVariant: 'standard' },
  }));
});

/** 跳转探针：读 location.pathname 即为点击结果的落地证据 */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <LocationProbe />
      <TheorySearch />
    </MemoryRouter>,
  );
}

function pathOf(): string {
  return screen.getByTestId('path').textContent ?? '';
}

function type(value: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
}

describe('TheorySearch', () => {
  it('目录层按章节标题命中并渲染可跳转结果行', async () => {
    mount();
    type('组合');
    const rows = await screen.findAllByRole('button', { name: new RegExp(i18n.t('theory.search.open')) });
    expect(rows.length).toBeGreaterThan(0);
    // 可访问名保留「打开 · 标题」格式（共享壳的 resultAriaLabel）
    expect(rows[0]!.getAttribute('aria-label')).toMatch(
      new RegExp(`^${i18n.t('theory.search.open')} · `),
    );
    fireEvent.click(rows[0]!);
    expect(pathOf()).toContain('/theory/chapter/');
    expect(loadFullText).not.toHaveBeenCalled();
  });

  it('术语与书目同时进入结果分组', async () => {
    mount();
    type(i18n.t('theory.glossary.title'));
    expect(await screen.findByText(i18n.t('theory.glossary.title'), { selector: 'span' })).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.search.categories.glossary'))).toBeTruthy();
  });

  it('目录层无命中时按需加载全文并命中正文片段', async () => {
    loadFullText.mockResolvedValue([fullTextLevel]);
    mount();
    type('独家令牌');
    expect(loadFullText).toHaveBeenCalledTimes(1);
    const row = await screen.findByRole('button', { name: /Outs/ });
    expect(row.textContent).toContain('独家令牌');
    fireEvent.click(row);
    expect(pathOf()).toBe('/theory/chapter/t1-outs');
  });

  it('全文也无命中时显示空态', async () => {
    loadFullText.mockResolvedValue([fullTextLevel]);
    mount();
    type('完全不存在的词');
    await waitFor(() => expect(loadFullText).toHaveBeenCalled());
    expect(await screen.findByText(i18n.t('theory.search.noResults'))).toBeTruthy();
  });

  it('单字不触发全文加载（避免全量 chunk 被一次误触拉入）', async () => {
    mount();
    type('z');
    await Promise.resolve();
    expect(loadFullText).not.toHaveBeenCalled();
  });

  it('全文加载跟随当前变体（单挑），不再固定请求 standard', async () => {
    useTheoryStore.setState((state) => ({
      progress: { ...state.progress, activeVariant: 'heads-up' },
    }));
    loadFullText.mockResolvedValue([]);
    mount();
    type('独家令牌');
    await waitFor(() => expect(loadFullText).toHaveBeenCalledWith('heads-up'));
  });

  it('共享壳口径：分区计数、术语/书目行指向各自聚合页、空查询不下「无结果」结论', async () => {
    mount();
    // 空查询：只有输入框提示，没有结果分区，也不显示空态
    expect(screen.queryByText(i18n.t('theory.search.noResults'))).toBeNull();

    type(i18n.t('theory.glossary.title'));
    const glossaryRow = await screen.findByRole('button', {
      name: new RegExp(`^${i18n.t('theory.search.open')} · ${i18n.t('theory.glossary.title')}`),
    });
    fireEvent.click(glossaryRow);
    expect(pathOf()).toBe('/theory/glossary');

    // 分区标题后跟命中计数（共享壳渲染 section.items.length）
    const sectionTitle = screen.getByText(i18n.t('theory.search.categories.glossary'));
    // 标题节点自身文字仍是分区名，计数在紧随其后的 span 里
    expect(sectionTitle.textContent).toContain(i18n.t('theory.search.categories.glossary'));
    expect(sectionTitle.querySelector('.font-numeric')?.textContent).toBe('1');
  });
});

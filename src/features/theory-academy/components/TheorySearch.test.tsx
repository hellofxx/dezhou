import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import type { TheoryLevelInfo } from '../types';
import { TheorySearch } from './TheorySearch';

/**
 * 检索面板契约（jsdom）。
 * 覆盖：目录层命中（章节标题）、术语 / 书目命中、目录层无命中时按需加载全文并命中正文、
 * 完全无结果时的空态文案。
 *
 * 全文层经 loadTheoryLevelsForVariant 注入（mock），验证「按需 + 一次」的加载时机；
 * 真实 chunk 切分与缓存由 data/levels/loaders 自身测试覆盖。
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
});

function mount() {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheorySearch />
    </MemoryRouter>,
  );
}

function type(value: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
}

describe('TheorySearch', () => {
  it('目录层按章节标题命中并渲染跳转链接', async () => {
    mount();
    type('组合');
    const links = await screen.findAllByRole('link', { name: new RegExp(i18n.t('theory.search.open')) });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]!.getAttribute('href')).toContain('/theory/chapter/');
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
    const link = await screen.findByRole('link', { name: /Outs/ });
    expect(link.getAttribute('href')).toBe('/theory/chapter/t1-outs');
    expect(link.textContent).toContain('独家令牌');
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
});

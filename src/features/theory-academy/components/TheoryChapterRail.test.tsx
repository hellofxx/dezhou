/**
 * 章节页学习导轨契约（jsdom）：
 * - 本级章节按数据顺序全量渲染为真实路由链接
 * - 当前章节带 aria-current="page"，其余不带
 * - 已完成章节以勾选图标替代序号（列表项仍可点击回访）
 * - 底部「返回目录」指向理论学院首页
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import { TheoryChapterRail } from './TheoryChapterRail';

afterEach(cleanup);

function makeChapter(order: number, id: string, title: string, supplemental = false): TheoryChapter {
  return {
    id,
    level: 1,
    order,
    title,
    subtitle: `${title}副标题`,
    duration: '10 min',
    variant: 'standard',
    supplemental,
    eloDimension: 'math',
    content: [{ type: 'text', content: '正文' }],
    quiz: [],
  };
}

const chapters = [
  makeChapter(1, 't1-combinatorics', '组合计数与起手牌概率'),
  makeChapter(2, 't1-outs', 'Outs 与 2/4 法则'),
  makeChapter(3, 't1-variance', '方差与长期视角'),
  makeChapter(4, 't1-extra', '增补章', true),
];

const level: TheoryLevelInfo = {
  id: 't1',
  level: 1,
  tier: 'basic',
  title: '概率论基础',
  description: '组合计数',
  icon: '🎲',
  chapters,
  unlockRequirement: '无',
  practiceRecommendations: { lessons: [] },
  variant: 'standard',
};

function mount(currentChapterId: string, completedChapters: string[] = []) {
  return render(
    <MemoryRouter>
      <TheoryChapterRail
        level={level}
        currentChapterId={currentChapterId}
        completedChapters={completedChapters}
      />
    </MemoryRouter>,
  );
}

describe('TheoryChapterRail', () => {
  it('本级章节全量渲染为章节链接，当前章节标记 aria-current', () => {
    mount('t1-outs', ['t1-combinatorics']);

    const links = screen.getAllByRole('link', { name: /组合计数与起手牌概率|Outs 与 2\/4 法则|方差与长期视角|增补章/ });
    expect(links).toHaveLength(chapters.length);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/theory\/chapter\/t1-/);
    });

    const current = screen.getByRole('link', { name: /Outs 与 2\/4 法则/ });
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /方差与长期视角/ }).getAttribute('aria-current')).toBeNull();
  });

  it('增补章带「可选」标记，返回目录指向学院首页', () => {
    mount('t1-outs', ['t1-combinatorics']);

    expect(screen.getByText(i18n.t('theory.ladder.chapterStates.optional'))).toBeTruthy();
    const back = screen.getByRole('link', { name: i18n.t('theory.chapterView.backToChapters') });
    expect(back.getAttribute('href')).toBe('/theory');
  });

  it('进度条按本级完成章节计算并可被读屏定位', () => {
    mount('t1-outs', ['t1-combinatorics', 't1-outs']);
    const progress = screen.getByRole('progressbar', { name: i18n.t('theory.chapterView.railTitle') });
    expect(progress.getAttribute('aria-valuenow')).toBe('50');
  });
});

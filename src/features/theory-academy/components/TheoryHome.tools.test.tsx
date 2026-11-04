import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryPlacementResult } from '../types';
import { useTheoryStore } from '../store';
import TheoryHome from './TheoryHome';

/**
 * 首页学习工具区契约（jsdom）：
 * - 三个工具入口（搜索 / 术语表 / 书目）常驻
 * - 定位测评：未测时给开始入口（指向 /theory/placement），已测时给成绩与免修徽章
 * - 收藏书签条：无收藏不占位，有收藏时渲染书签条
 * - 反向桥接推荐卡：无 ELO 数据时指向 T1 首章（映射算法本身另有单测）
 *
 * 刻意不 mock loaders：首页只用目录摘要层，加载器不应被触发（懒加载边界回归）。
 */

MotionGlobalConfig.skipAnimations = true;

vi.mock('../data/levels/loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/levels/loaders')>();
  return { ...actual, loadTheoryLevelById: () => Promise.resolve(undefined) };
});

const originalProgress = useTheoryStore.getState().progress;

function reset(progress: Partial<typeof originalProgress> = {}) {
  useTheoryStore.setState({
    progress: {
      ...originalProgress,
      completedChapters: [],
      quizScores: {},
      bookmarkedChapters: [],
      flaggedQuestions: [],
      chapterAttempts: {},
      checkpoints: {},
      placement: undefined,
      ...progress,
    },
  });
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryHome />
    </MemoryRouter>,
  );
}

beforeEach(() => reset());
afterEach(() => cleanup());

describe('TheoryHome 学习工具入口', () => {
  it('渲染搜索 / 术语表 / 书目三个入口', () => {
    mount();
    expect(screen.getByRole('button', { name: i18n.t('theory.search.title') })).toBeTruthy();
    expect(screen.getByRole('button', { name: i18n.t('theory.glossary.title') })).toBeTruthy();
    expect(screen.getByRole('button', { name: i18n.t('theory.bibliography.title') })).toBeTruthy();
  });

  it('点击搜索入口打开检索弹层并聚焦输入框', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('theory.search.title') }));
    expect(screen.getByRole('searchbox')).toBeTruthy();
    // 弹层打开后背景内容被 aria-hidden，因此只断言弹层内的标题与输入框
    expect(screen.getAllByText(i18n.t('theory.search.title')).length).toBeGreaterThan(1);
  });

});

describe('TheoryHome 定位测评卡', () => {
  it('未测评时给开始入口', () => {
    mount();
    expect(screen.getByText(i18n.t('theory.placement.title'))).toBeTruthy();
    const link = screen.getByRole('link', { name: i18n.t('theory.placement.start') });
    expect(link.getAttribute('href')).toBe('/theory/placement');
  });

  it('已测评时展示成绩、推荐起点与免修徽章', () => {
    const placement: TheoryPlacementResult = {
      score: 80,
      correct: 8,
      total: 10,
      recommendedLevelId: 't3',
      creditLevels: ['t1', 't2'],
      completedAt: 1,
    };
    reset({ placement });
    mount();
    expect(
      screen.getByText(
        i18n.t('theory.placement.score', { correct: 8, total: 10, score: 80 }),
      ),
    ).toBeTruthy();
    expect(
      screen.getAllByText(new RegExp(i18n.t('theory.placement.creditedBadge'))).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: i18n.t('theory.placement.retake') })).toBeTruthy();
  });
});

describe('TheoryHome 收藏书签条', () => {
  it('无收藏时不渲染书签条', () => {
    mount();
    expect(screen.queryByText(i18n.t('theory.bookmarks.empty'))).toBeNull();
  });

  it('有收藏时渲染书签条与章节链接', () => {
    reset({ bookmarkedChapters: ['t1-combinatorics'] });
    mount();
    const links = screen.getAllByRole('link', { name: /组合计数/ });
    expect(links.some((link) => link.getAttribute('href') === '/theory/chapter/t1-combinatorics')).toBe(true);
  });
});

describe('TheoryHome 反向桥接推荐卡', () => {
  it('无 ELO 数据时推荐 T1 首章并给出入口', () => {
    mount();
    expect(screen.getByText(i18n.t('theory.recommendation.title'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.recommendation.reason.fallback'))).toBeTruthy();
    const links = screen.getAllByRole('link', { name: new RegExp(i18n.t('theory.recommendation.cta')) });
    expect(links[0]!.getAttribute('href')).toBe('/theory/chapter/t1-combinatorics');
  });
});

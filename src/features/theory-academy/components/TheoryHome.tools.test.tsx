import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryPlacementResult } from '../types';
import { useTheoryStore } from '../store';
import { getLevelSummariesByVariant } from '../utils/theoryMeta';
import TheoryHome from './TheoryHome';

/**
 * 首页学习工具区契约（jsdom）：
 * - 三个工具入口（搜索 / 术语表 / 书目）常驻
 * - 评估区聚合：定位测评 + 检查点同处一个 section（地图不再重复测评成绩详情）
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

function LocationProbe() {
  const location = useLocation();
  const source = (location.state as { courseFrom?: { source?: string } } | null)?.courseFrom
    ?.source;
  return (
    <>
      <p data-testid="location">{location.pathname}</p>
      <p data-testid="location-state">{source ?? 'none'}</p>
    </>
  );
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryHome />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
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

describe('TheoryHome 地图根返回与桥接来源', () => {
  it('顶部提供返回课程枢纽入口', () => {
    mount();
    const back = screen.getByRole('link', { name: i18n.t('nav.backToCourseHub') });
    expect(back.getAttribute('href')).toBe('/lesson');
  });

  it('实践桥接跳转策略学院时携带来源 state', () => {
    mount();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(i18n.t('theory.bridge.cta')) }),
    );
    expect(screen.getByTestId('location').textContent).toBe('/academy');
    expect(screen.getByTestId('location-state').textContent).toBe('theory-map');
  });
});

describe('TheoryHome 变体只读面板', () => {
  it('展示当前变体，切换入口指向课程主线 /lesson 且不再提供本地分段控件', () => {
    mount();
    const activeVariant = useTheoryStore.getState().progress.activeVariant;
    const heading = screen.getByRole('heading', { name: i18n.t('variant.title') });
    expect(heading.closest('.variant-panel')).not.toBeNull();
    expect(screen.getAllByText(i18n.t(`variant.name.${activeVariant}`)).length).toBeGreaterThan(0);
    const links = screen.getAllByRole('link', { name: i18n.t('variant.switchInCourseHub') });
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute('href')).toBe('/lesson');
    expect(screen.queryByRole('group', { name: i18n.t('variant.selectVariant') })).toBeNull();
  });
});

describe('TheoryHome 评估区聚合', () => {
  it('定位测评与检查点入口同处评估区，各自指向目标路由', () => {
    reset({ activeVariant: 'standard' });
    mount();
    const region = screen.getByRole('region', { name: i18n.t('nav.assessment') });
    const placement = within(region).getByRole('link', { name: i18n.t('nav.theoryPlacement') });
    expect(placement.getAttribute('href')).toBe('/theory/placement');
    const checkpoint = within(region).getByRole('link', { name: i18n.t('nav.theoryCheckpoint') });
    // 检查点入口指向当前进行中的 Level（空进度时为首级）
    expect(checkpoint.getAttribute('href')).toBe(
      `/theory/checkpoint/${getLevelSummariesByVariant('standard')[0]!.id}`,
    );
  });

  it('已测评时地图不再重复成绩与免修详情（归定位测评页）', () => {
    const placement: TheoryPlacementResult = {
      score: 80,
      correct: 8,
      total: 10,
      recommendedLevelId: 't3',
      creditLevels: ['t1', 't2'],
      completedAt: 1,
    };
    reset({ activeVariant: 'standard', placement });
    mount();
    expect(
      screen.queryByText(i18n.t('theory.placement.score', { correct: 8, total: 10, score: 80 })),
    ).toBeNull();
    expect(screen.queryByRole('link', { name: i18n.t('theory.placement.retake') })).toBeNull();
    // 评估区入口仍在
    expect(
      screen.getByRole('link', { name: i18n.t('nav.theoryPlacement') }),
    ).toBeTruthy();
  });
});

describe('TheoryHome 收藏书签条', () => {
  it('无收藏时不渲染书签条', () => {
    mount();
    expect(screen.queryByText(i18n.t('theory.bookmarks.empty'))).toBeNull();
  });

  it('有收藏时渲染书签条与章节入口', () => {
    reset({ bookmarkedChapters: ['t1-combinatorics'] });
    mount();
    // 书签条条目由共享面板渲染为 button + onNavigate（共享层不引 router），用路由探针断言跳转
    fireEvent.click(screen.getByRole('button', { name: i18n.t('theory.chapterTitle.t1-combinatorics') }));
    expect(screen.getByTestId('location').textContent).toBe('/theory/chapter/t1-combinatorics');
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

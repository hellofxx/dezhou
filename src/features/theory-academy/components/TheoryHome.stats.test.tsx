import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { useTheoryStore } from '../store';
import TheoryHome from './TheoryHome';

/**
 * 理论地图瘦身后契约（jsdom）：
 * - 阅读统计默认折叠（原生 details），不占据地图主干视线
 * - 有疑难标记时统计自动展开，SRS 复习入口保持可见
 * - 掌握度卡已上收课程枢纽，地图不再重复
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

describe('TheoryHome 阅读统计折叠', () => {
  it('无疑难标记时统计默认折叠', () => {
    const { container } = mount();
    const section = container.querySelector(
      `section[aria-label="${i18n.t('theory.stats.title')}"]`,
    );
    expect(section).toBeTruthy();
    const details = section!.querySelector('details');
    expect(details).toBeTruthy();
    expect(details!.open).toBe(false);
  });

  it('有疑难标记时统计自动展开，复习入口可见', () => {
    reset({ flaggedQuestions: ['q1'] });
    const { container } = mount();
    const section = container.querySelector(
      `section[aria-label="${i18n.t('theory.stats.title')}"]`,
    );
    expect(section!.querySelector('details')!.open).toBe(true);
    expect(screen.getByRole('link', { name: /疑难/ })).toBeTruthy();
  });
});

describe('TheoryHome 掌握度单源', () => {
  it('掌握度卡已上收课程枢纽，地图不再渲染', () => {
    mount();
    expect(screen.queryByText(i18n.t('theory.mastery.title'))).toBeNull();
  });
});
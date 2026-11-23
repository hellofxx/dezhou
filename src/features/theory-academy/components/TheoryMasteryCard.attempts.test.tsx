import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryChapterAttempt, TheoryChapterSummary } from '../types';
import { TheoryMasteryCard } from './TheoryMasteryCard';

/**
 * 掌握度卡首批成绩口径契约（jsdom）：
 * - 传入 chapterAttempts 时按**首次成绩**统计掌握度（重考刷分不改变分档）
 * - 练习最佳（bestScore 最大值）单独展示，标注为练习口径
 * - 检查点入口不在此卡渲染（统一收敛到地图评估区，另行锁定）
 * 旧的 quizScores-only 行为由 TheoryMasteryCard.test.tsx 锁定，本文件只覆盖新增口径。
 */

MotionGlobalConfig.skipAnimations = true;
afterEach(() => cleanup());

function chapter(id: string, order: number): TheoryChapterSummary {
  return {
    id,
    level: 1,
    order,
    title: id,
    subtitle: '',
    duration: '10 min',
    variant: 'standard',
  };
}

const c1 = chapter('att-c1', 1);
const c2 = chapter('att-c2', 2);
const c3 = chapter('att-c3', 3);

function attempt(firstScore: number, bestScore: number): TheoryChapterAttempt {
  return {
    attempts: 2,
    firstScore,
    firstCorrect: Math.round(firstScore / 20),
    firstTotal: 5,
    bestScore,
    lastScore: bestScore,
    lastAt: 1,
  };
}

function countOf(container: HTMLElement, state: string): string {
  const row = container.querySelector(`[data-mastery-state="${state}"]`);
  return row?.textContent ?? '';
}

describe('TheoryMasteryCard 首次成绩与练习最佳', () => {
  it('首次成绩入库后按首次成绩分档，练习最佳单独展示', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryMasteryCard
          chapters={[c1, c2, c3]}
          quizScores={{ [c1.id]: 95, [c2.id]: 70 }}
          chapterAttempts={{ [c1.id]: attempt(40, 95), [c2.id]: attempt(70, 70) }}
        />
      </MemoryRouter>,
    );
    // c1 首次 40 → 待复习（而非 quizScores 的 95 → 已掌握）
    expect(countOf(container, 'needsReview')).toContain('1');
    expect(countOf(container, 'passing')).toContain('1');
    expect(countOf(container, 'mastered')).toContain('0');
    expect(countOf(container, 'untested')).toContain('1');
    expect(screen.getByText(i18n.t('theory.quiz.bestScoreLabel'))).toBeTruthy();
    expect(screen.getByText('95')).toBeTruthy();
  });

  it('未传 chapterAttempts 时不展示练习口径行（旧调用方零变化）', () => {
    render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryMasteryCard chapters={[c1]} quizScores={{ [c1.id]: 90 }} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(i18n.t('theory.quiz.bestScoreLabel'))).toBeNull();
  });
});

describe('TheoryMasteryCard 检查点入口已收敛', () => {
  it('掌握度卡不再渲染检查点链接（入口统一到地图评估区）', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryMasteryCard
          chapters={[c1, c2]}
          quizScores={{ [c1.id]: 90, [c2.id]: 80 }}
          chapterAttempts={{ [c1.id]: attempt(90, 90), [c2.id]: attempt(80, 80) }}
        />
      </MemoryRouter>,
    );
    expect(container.querySelector('a[href^="/theory/checkpoint/"]')).toBeNull();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type {
  TheoryChapterAttempt,
  TheoryChapterSummary,
  TheoryCheckpointAttempt,
  TheoryLevelSummary,
} from '../types';
import { TheoryMasteryCard } from './TheoryMasteryCard';

/**
 * 掌握度卡首批成绩口径契约（jsdom）：
 * - 传入 chapterAttempts 时按**首次成绩**统计掌握度（重考刷分不改变分档）
 * - 练习最佳（bestScore 最大值）单独展示，标注为练习口径
 * - 已读完的 Level 出现检查点入口，并显示历史最佳分
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

function level(chapters: TheoryChapterSummary[]): TheoryLevelSummary {
  return {
    id: 't1',
    level: 1,
    tier: 'basic',
    title: 'T1 标题',
    description: 'T1 描述',
    icon: '🎲',
    chapters,
    unlockRequirement: '无',
    practiceRecommendations: { lessons: [] },
    variant: 'standard',
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
          completedChapters={[c1.id, c2.id]}
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

describe('TheoryMasteryCard 检查点入口', () => {
  it('核心章读完后按 Level 渲染检查点入口与历史最佳', () => {
    const checkpoints: Record<string, TheoryCheckpointAttempt> = {
      t1: { attempts: 1, bestScore: 76, lastScore: 76, lastAt: 1, questionIds: [] },
    };
    render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryMasteryCard
          chapters={[c1, c2]}
          quizScores={{ [c1.id]: 90, [c2.id]: 80 }}
          completedChapters={[c1.id, c2.id]}
          levels={[level([c1, c2])]}
          checkpoints={checkpoints}
        />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: new RegExp(i18n.t('theory.level.checkpointEntry')) });
    expect(link.getAttribute('href')).toBe('/theory/checkpoint/t1');
    expect(link.textContent).toContain(i18n.t('theory.checkpoint.bestScore', { score: 76 }));
  });

  it('未读完本级核心章时不渲染检查点入口', () => {
    render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryMasteryCard
          chapters={[c1, c2]}
          quizScores={{ [c1.id]: 90 }}
          completedChapters={[c1.id]}
          levels={[level([c1, c2])]}
        />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole('link', { name: new RegExp(i18n.t('theory.level.checkpointEntry')) }),
    ).toBeNull();
  });
});

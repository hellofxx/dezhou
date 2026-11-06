import { describe, expect, it } from 'vitest';
import type { TheoryChapterAttempt, TheoryChapterSummary } from '../types';
import { ACADEMY_MASTERY_THRESHOLDS, getMasteryState } from '@/shared/utils/academyMastery';
import { resolveFirstScore, summarizeMastery } from './theoryMastery';

/**
 * 掌握度派生纯函数回归。
 * 阈值是展示口径的唯一事实源（不门禁），因此边界值（79/80、59/60）与
 * "统计范围由入参决定" 这两件事必须锁死：一旦阈值或 tie-break 规则漂移，
 * 首页的「已掌握」数量与「复习最弱一章」指向的章节都会静默变化。
 * 另锁定首次成绩优先口径：重考刷高 bestScore 不得抬高掌握度。
 *
 * 阈值 / getMasteryState 的实现只有 `shared/utils/academyMastery` 一份
 * （理论侧 theoryMastery 只做首次成绩解析 + 薄包装），故此处直接断言共享单源。
 */

/** 测试用最小章节摘要（只用到 id 与目录顺序） */
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

/** 测试用最小 attempt 记录 */
function attempt(firstScore: number, bestScore = firstScore): TheoryChapterAttempt {
  return {
    attempts: 1,
    firstScore,
    firstCorrect: 0,
    firstTotal: 0,
    bestScore,
    lastScore: bestScore,
    lastAt: 1,
  };
}

const chapters = [chapter('a', 1), chapter('b', 2), chapter('c', 3), chapter('d', 4), chapter('e', 5)];

describe('掌握度阈值与状态归类（shared 单源）', () => {
  it('阈值常量为 80 / 60（唯一事实源）', () => {
    expect(ACADEMY_MASTERY_THRESHOLDS).toEqual({ mastered: 80, passing: 60 });
  });

  it('已掌握边界：80 记为已掌握，79 落到通过', () => {
    expect(getMasteryState(100)).toBe('mastered');
    expect(getMasteryState(80)).toBe('mastered');
    expect(getMasteryState(79)).toBe('passing');
  });

  it('通过边界：60 记为通过，59 落到待复习', () => {
    expect(getMasteryState(60)).toBe('passing');
    expect(getMasteryState(59)).toBe('needsReview');
    expect(getMasteryState(0)).toBe('needsReview');
  });

  it('无分数记录（undefined）为未测', () => {
    expect(getMasteryState(undefined)).toBe('untested');
  });
});

describe('theoryMastery.summarizeMastery', () => {
  it('四项计数与总数按分数档位归类', () => {
    const summary = summarizeMastery(chapters, { a: 95, b: 80, c: 60, d: 59 });

    expect(summary).toMatchObject({
      mastered: 2,
      passing: 1,
      needsReview: 1,
      untested: 1,
      total: 5,
    });
  });

  it('无任何分数时全部为未测，且没有最弱章', () => {
    const summary = summarizeMastery(chapters, {});

    expect(summary.untested).toBe(5);
    expect(summary.total).toBe(5);
    expect(summary.weakestChapterId).toBeUndefined();
  });

  it('最弱章取已测章节的最低分', () => {
    const summary = summarizeMastery(chapters, { a: 90, b: 72, c: 41, d: 66 });

    expect(summary.weakestChapterId).toBe('c');
  });

  it('同分时按传入顺序（目录顺序）取第一个，不受分数表顺序影响', () => {
    const scores = { e: 50, c: 50, a: 85 };

    expect(summarizeMastery(chapters, scores).weakestChapterId).toBe('c');
    expect(summarizeMastery([...chapters].reverse(), scores).weakestChapterId).toBe('e');
  });

  it('只统计传入的章节：集合外章节的分数不进入计数与最弱章判定', () => {
    // f 不在 core 列表里（视为增补章），分数再低也不能成为「复习最弱一章」的目标
    const scores = { a: 88, b: 70, f: 10 };
    const summary = summarizeMastery([chapter('a', 1), chapter('b', 2)], scores);

    expect(summary).toMatchObject({ mastered: 1, passing: 1, needsReview: 0, untested: 0, total: 2 });
    expect(summary.weakestChapterId).toBe('b');
  });
});

describe('theoryMastery 首次成绩优先口径', () => {
  it('resolveFirstScore 优先 firstScore，无 attempts 记录时回退 quizScores', () => {
    const scores = { a: 95 };
    const attempts = { a: attempt(50, 95) };

    expect(resolveFirstScore('a', scores, attempts)).toBe(50);
    expect(resolveFirstScore('a', scores)).toBe(95);
    expect(resolveFirstScore('b', scores, attempts)).toBeUndefined();
  });

  it('传入 chapterAttempts 时按首次成绩归类：重考刷高 bestScore 不抬高掌握度', () => {
    const scores = { a: 95, b: 90 };
    const attempts = { a: attempt(50, 95), b: attempt(85, 90) };

    const summary = summarizeMastery([chapter('a', 1), chapter('b', 2)], scores, attempts);

    expect(summary).toMatchObject({ mastered: 1, passing: 0, needsReview: 1, untested: 0 });
    // 最弱章按首次成绩判定：a 首次 50 分
    expect(summary.weakestChapterId).toBe('a');
  });

  it('首次成绩为 0 是合法分数（needsReview），不因假值回退成未测', () => {
    const summary = summarizeMastery([chapter('a', 1)], { a: 100 }, { a: attempt(0, 100) });

    expect(summary).toMatchObject({ mastered: 0, needsReview: 1, untested: 0 });
  });

  it('省略 chapterAttempts 时保持旧调用行为（quizScores 最高分）', () => {
    const summary = summarizeMastery([chapter('a', 1), chapter('b', 2)], { a: 95, b: 40 });

    expect(summary).toMatchObject({ mastered: 1, needsReview: 1 });
  });
});

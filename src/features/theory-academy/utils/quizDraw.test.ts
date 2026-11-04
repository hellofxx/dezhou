import { describe, it, expect } from 'vitest';
import {
  QUIZ_DRAW_SIZE_ADVANCED,
  QUIZ_DRAW_SIZE_BASIC,
  drawQuizQuestions,
  getChapterAttemptNumber,
  getQuizDrawSeed,
  getQuizDrawSize,
  isFirstChapterAttempt,
} from './quizDraw';
import type { TheoryChapterAttempt } from '../types';

const POOL = Array.from({ length: 12 }, (_, i) => ({ id: `q${i + 1}` }));

function attemptRecord(attempts: number): TheoryChapterAttempt {
  return {
    attempts,
    firstScore: 60,
    firstCorrect: 3,
    firstTotal: 5,
    bestScore: 80,
    lastScore: 80,
    lastAt: 1,
  };
}

describe('quizDraw 题量口径', () => {
  it('T1–T3 抽 5 题，T4–T9 抽 6 题', () => {
    for (const level of [1, 2, 3]) {
      expect(getQuizDrawSize(level)).toBe(QUIZ_DRAW_SIZE_BASIC);
    }
    for (const level of [4, 5, 6, 7, 8, 9]) {
      expect(getQuizDrawSize(level)).toBe(QUIZ_DRAW_SIZE_ADVANCED);
    }
    expect(QUIZ_DRAW_SIZE_BASIC).toBe(5);
    expect(QUIZ_DRAW_SIZE_ADVANCED).toBe(6);
  });
});

describe('quizDraw 抽题确定性', () => {
  it('同 chapterId + 同 attemptNumber 结果逐位相同', () => {
    const a = drawQuizQuestions(POOL, { chapterId: 't1-combinatorics', attemptNumber: 1, size: 5 });
    const b = drawQuizQuestions(POOL, { chapterId: 't1-combinatorics', attemptNumber: 1, size: 5 });
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
    expect(a).toHaveLength(5);
  });

  it('不同 attemptNumber 抽到不同子集（重考换题）', () => {
    const first = drawQuizQuestions(POOL, { chapterId: 't1-combinatorics', attemptNumber: 1, size: 5 });
    const second = drawQuizQuestions(POOL, { chapterId: 't1-combinatorics', attemptNumber: 2, size: 5 });
    expect(first.map((q) => q.id)).not.toEqual(second.map((q) => q.id));
  });

  it('同一作答序号内无重复题', () => {
    for (const attemptNumber of [1, 2, 3]) {
      const drawn = drawQuizQuestions(POOL, { chapterId: 't4-range-thinking', attemptNumber, size: 6 });
      expect(new Set(drawn.map((q) => q.id)).size).toBe(drawn.length);
    }
  });

  it('抽出的题都来自原题池（子集关系）', () => {
    const drawn = drawQuizQuestions(POOL, { chapterId: 't2-ev', attemptNumber: 3, size: 5 });
    const poolIds = new Set(POOL.map((q) => q.id));
    expect(drawn.every((q) => poolIds.has(q.id))).toBe(true);
  });

  it('种子只依赖 chapterId 与 attemptNumber', () => {
    expect(getQuizDrawSeed('t1-outs', 2)).toBe(getQuizDrawSeed('t1-outs', 2));
    expect(getQuizDrawSeed('t1-outs', 2)).not.toBe(getQuizDrawSeed('t1-outs', 3));
    expect(getQuizDrawSeed('t1-outs', 2)).not.toBe(getQuizDrawSeed('t1-variance', 2));
  });

  it('题池不足时全量出战，不重复不补空', () => {
    const tiny = POOL.slice(0, 3);
    const drawn = drawQuizQuestions(tiny, { chapterId: 't1-outs', attemptNumber: 1, size: 6 });
    expect(drawn).toHaveLength(3);
    expect(new Set(drawn.map((q) => q.id))).toEqual(new Set(tiny.map((q) => q.id)));
  });

  it('空题池返回空数组（不抛错，供视图空题库兜底）', () => {
    expect(drawQuizQuestions([], { chapterId: 't9-mop', attemptNumber: 1, size: 6 })).toEqual([]);
  });
});

describe('作答序号口径（持久化单一事实源）', () => {
  it('无记录时为首次（序号 1，isFirst 为真）', () => {
    expect(getChapterAttemptNumber(undefined, 't1-outs')).toBe(1);
    expect(isFirstChapterAttempt(undefined, 't1-outs')).toBe(true);
    expect(getChapterAttemptNumber({}, 't1-outs')).toBe(1);
  });

  it('已测 n 次时序号为 n+1 且判为练习', () => {
    const attempts = { 't1-outs': attemptRecord(2) };
    expect(getChapterAttemptNumber(attempts, 't1-outs')).toBe(3);
    expect(isFirstChapterAttempt(attempts, 't1-outs')).toBe(false);
  });

  it('按 chapterId 隔离，其他章的记录不影响本章', () => {
    const attempts = { 't1-outs': attemptRecord(4) };
    expect(getChapterAttemptNumber(attempts, 't1-variance')).toBe(1);
    expect(isFirstChapterAttempt(attempts, 't1-variance')).toBe(true);
  });
});

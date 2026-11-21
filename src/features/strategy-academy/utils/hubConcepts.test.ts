import { describe, expect, it } from 'vitest';
import type { TheoryLearningSnapshot } from '@/shared/types/theoryDataSource';
import {
  buildConceptScores,
  selectNextConceptInStage,
  selectWeakConceptInStage,
  stageConceptCounts,
} from './hubConcepts';

describe('hubConcepts', () => {
  it('弱项只取已测且低于 passing 的最低分，同分保留顺序', () => {
    expect(selectWeakConceptInStage([], {})).toBeUndefined();
    expect(selectWeakConceptInStage(['a', 'b'], {})).toBeUndefined();
    expect(selectWeakConceptInStage(['a', 'b'], { a: 45, b: 90 })).toBe('a');
    expect(selectWeakConceptInStage(['a', 'b'], { a: 45, b: 30 })).toBe('b');
    expect(selectWeakConceptInStage(['a', 'b'], { a: 45, b: 45 })).toBe('a');
    expect(selectWeakConceptInStage(['a'], { a: 60 })).toBeUndefined();
  });

  it('下一概念跳过已读章节', () => {
    expect(selectNextConceptInStage(['a', 'b'], [])).toBe('a');
    expect(selectNextConceptInStage(['a', 'b'], ['a'])).toBe('b');
    expect(selectNextConceptInStage(['a', 'b'], ['a', 'b'])).toBeUndefined();
  });

  it('首次分优先于历史最高分', () => {
    const snapshot: TheoryLearningSnapshot = {
      completedChapters: ['a'],
      quizScores: { a: 95 },
      chapterAttempts: { a: { firstScore: 40, lastScore: 95, attempts: 2 } },
    };

    expect(buildConceptScores(['a'], snapshot)).toEqual({ a: 40 });
  });

  it('段内计数区分已读、已掌握、待复习与未测', () => {
    expect(
      stageConceptCounts(['a', 'b', 'c'], ['a'], { a: 85, b: 45 }),
    ).toEqual({ total: 3, done: 1, mastered: 1, needsReview: 1, untested: 1 });
  });
});
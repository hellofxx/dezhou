import { describe, expect, it } from 'vitest';
import {
  MAX_LESSON_NOTE_LENGTH,
  higherPlacementLevel,
  mergePlacement,
  nextCheckpointRecord,
  nextLessonAttemptRecord,
  toggleBookmark,
  upsertLessonNote,
} from './p2State';

describe('p2State placement', () => {
  it('creditLevels 单调并集并过滤 L5+；推荐起点不降级', () => {
    const placement = mergePlacement(
      {
        recommendedLevelId: 'l4a',
        creditLevels: ['l1', 'l2', 'l3'],
        correct: 12,
        total: 16,
        takenAt: 1,
      },
      {
        recommendedLevelId: 'l2',
        creditLevels: ['l1', 'l2', 'l5'],
        correct: 6,
        total: 16,
      },
      2,
    );

    expect(placement.recommendedLevelId).toBe('l4a');
    expect(placement.creditLevels).toEqual(['l1', 'l2', 'l3']);
    expect(placement.takenAt).toBe(2);
  });

  it('higherPlacementLevel 取更高档', () => {
    expect(higherPlacementLevel('l2', 'l4b')).toBe('l4b');
    expect(higherPlacementLevel('l4a', 'l1')).toBe('l4a');
  });
});

describe('p2State checkpoint/attempt', () => {
  it('checkpoint 首次定 first，重考更新 best/last', () => {
    const first = nextCheckpointRecord(undefined, { score: 60, questionIds: ['q1'] }, 10);
    expect(first.isFirstAttempt).toBe(true);
    expect(first.record).toMatchObject({ attempts: 1, firstScore: 60, bestScore: 60, lastScore: 60 });

    const second = nextCheckpointRecord(first.record, { score: 90, questionIds: ['q2'] }, 20);
    expect(second.isFirstAttempt).toBe(false);
    expect(second.record).toMatchObject({
      attempts: 2,
      firstScore: 60,
      bestScore: 90,
      lastScore: 90,
      questionIds: ['q2'],
    });
  });

  it('lesson attempt 首次写 firstCorrect/firstTotal，重考保持 first', () => {
    const first = nextLessonAttemptRecord(undefined, { score: 80, correct: 4, total: 5 }, 10);
    expect(first).toMatchObject({ attempts: 1, firstScore: 80, firstCorrect: 4, firstTotal: 5 });
    const second = nextLessonAttemptRecord(first, { score: 60, correct: 3, total: 5 }, 20);
    expect(second).toMatchObject({
      attempts: 2,
      firstScore: 80,
      firstCorrect: 4,
      firstTotal: 5,
      bestScore: 80,
      lastScore: 60,
    });
  });
});

describe('p2State notes/bookmarks', () => {
  it('书签 toggle 幂等', () => {
    expect(toggleBookmark([], 'a')).toEqual(['a']);
    expect(toggleBookmark(['a'], 'a')).toEqual([]);
  });

  it('笔记 trim/截断/空文本删除', () => {
    const long = 'x'.repeat(MAX_LESSON_NOTE_LENGTH + 10);
    const notes = upsertLessonNote({}, 'a', `  ${long}  `, 10);
    expect(notes.a?.text).toHaveLength(MAX_LESSON_NOTE_LENGTH);
    const cleared = upsertLessonNote(notes, 'a', '   ', 20);
    expect(cleared).toEqual({});
  });
});

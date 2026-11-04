import { describe, expect, it } from 'vitest';
import type { TheoryProgress } from '../types';
import {
  findNextTheoryChapter,
  getCoreChaptersOfLevel,
  getLevelSummariesByVariant,
  isLevelUnlockedByCompleted,
} from './theoryMeta';

/**
 * Wave 0 契约：解锁免修（creditLevels）与「下一章」推荐单源。
 *
 * 定位测评只写 placement.creditLevels（不写 completedChapters），
 * 因此 isLevelUnlockedByCompleted 与 findNextTheoryChapter 必须共用同一免修口径；
 * 一旦两处漂移，进度模块的每日计划会推荐到锁定章节，或免修用户被卡回目录。
 */

/** 最小 TheoryProgress（只填必需字段，其余按用例覆盖） */
function progressOf(overrides: Partial<TheoryProgress> = {}): TheoryProgress {
  return {
    completedChapters: [],
    quizScores: {},
    currentChapter: null,
    startedAt: 0,
    flaggedQuestions: [],
    activeVariant: 'standard',
    ...overrides,
  };
}

const standardLevels = getLevelSummariesByVariant('standard');
const t1 = standardLevels[0]!;
const t2 = standardLevels[1]!;
const firstT1Core = getCoreChaptersOfLevel(t1)[0]!;
const firstT2Core = getCoreChaptersOfLevel(t2)[0]!;
const t1CoreIds = getCoreChaptersOfLevel(t1).map((chapter) => chapter.id);

describe('isLevelUnlockedByCompleted × creditLevels', () => {
  it('免修 Level 直接解锁，未知 Level 仍锁定', () => {
    expect(isLevelUnlockedByCompleted('t3', [], ['t1', 't2', 't3'])).toBe(true);
    expect(isLevelUnlockedByCompleted('t99', [], ['t1'])).toBe(false);
  });

  it('前一 Level 被免修即可解锁下一级（免修是连续前缀）', () => {
    expect(isLevelUnlockedByCompleted('t2', [], ['t1'])).toBe(true);
    // T1 免修不等于 T3 解锁：T3 只要求 T2 免修或 T2 核心章完成
    expect(isLevelUnlockedByCompleted('t3', [], ['t1'])).toBe(false);
    expect(isLevelUnlockedByCompleted('t3', [], ['t1', 't2'])).toBe(true);
  });

  it('免修不影响「核心章完成」路径：无免修时行为与旧版一致', () => {
    expect(isLevelUnlockedByCompleted('t2', [], [])).toBe(false);
    expect(isLevelUnlockedByCompleted('t2', t1CoreIds, [])).toBe(true);
  });
});

describe('findNextTheoryChapter', () => {
  it('零进度：返回 T1 首个核心章', () => {
    expect(findNextTheoryChapter(progressOf())?.id).toBe(firstT1Core.id);
  });

  it('跳过已完成章节：返回 T1 首个未完成核心章', () => {
    const [first, second] = getCoreChaptersOfLevel(t1);
    const progress = progressOf({ completedChapters: [first!.id] });
    expect(findNextTheoryChapter(progress)?.id).toBe(second!.id);
  });

  it('T1 核心章全部完成：跨 Level 返回 T2 首个核心章', () => {
    const progress = progressOf({ completedChapters: t1CoreIds });
    expect(findNextTheoryChapter(progress)?.id).toBe(firstT2Core.id);
  });

  it('定位免修跳过已免修 Level：T1-T3 免修且未读 → 推荐 T4 首个核心章', () => {
    const progress = progressOf({
      placement: {
        score: 90,
        correct: 14,
        total: 16,
        recommendedLevelId: 't6',
        creditLevels: ['t1', 't2', 't3'],
        completedAt: 1,
      },
    });
    const t4 = standardLevels[3]!;
    expect(findNextTheoryChapter(progress)?.id).toBe(getCoreChaptersOfLevel(t4)[0]!.id);
  });

  it('不推荐增补章：即使增补章未读，也优先返回核心章', () => {
    const progress = progressOf();
    const next = findNextTheoryChapter(progress);
    expect(next?.supplemental).not.toBe(true);
  });

  it('所有核心章完成后返回 null', () => {
    const allCoreIds = standardLevels.flatMap((level) =>
      getCoreChaptersOfLevel(level).map((chapter) => chapter.id),
    );
    expect(allCoreIds.length).toBeGreaterThan(0);
    expect(findNextTheoryChapter(progressOf({ completedChapters: allCoreIds }))).toBeNull();
  });

  it('按 activeVariant 序列推荐（heads-up 不跨变体）', () => {
    const headsUpFirst = getCoreChaptersOfLevel(getLevelSummariesByVariant('heads-up')[0]!)[0]!;
    const next = findNextTheoryChapter(progressOf({ activeVariant: 'heads-up' }));
    expect(next?.id).toBe(headsUpFirst.id);
    expect(next?.variant).toBe('heads-up');
  });
});

import { describe, expect, it } from 'vitest';
import { LEGACY_HEADS_UP_CORE_CHAPTERS } from '../store.defaults';
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

/**
 * persist v5 宽限名单（legacyUnlockedLevels）：单挑新增核心章后，存量用户当时已解锁的 Level
 * 不能因「前一 Level 核心章不全」被重锁。宽限只放宽门禁，不写完成、不改变推荐顺序。
 */
describe('isLevelUnlockedByCompleted × legacyUnlockedLevels', () => {
  const headsUp = getLevelSummariesByVariant('heads-up');
  const t1hu = headsUp[0]!;
  const t2hu = headsUp[1]!;
  const t3hu = headsUp[2]!;

  it('宽限名单命中即解锁，未命中仍按前一 Level 核心章判定', () => {
    expect(isLevelUnlockedByCompleted(t3hu.id, [], [], [])).toBe(false);
    expect(isLevelUnlockedByCompleted(t3hu.id, [], [], [t3hu.id])).toBe(true);
    // 宽限不外溢：名单里只有 t3hu 时，t2hu 仍保持锁定
    expect(isLevelUnlockedByCompleted(t2hu.id, [], [], [t3hu.id])).toBe(false);
  });

  it('宽限不削弱既有两条路径（顺序完成 / 定位免修）', () => {
    // 顺序完成：t2hu 的解锁看的是前一 Level（t1hu）核心章，与自身完成度无关
    const t1huCoreIds = getCoreChaptersOfLevel(t1hu).map((chapter) => chapter.id);
    expect(isLevelUnlockedByCompleted(t2hu.id, t1huCoreIds, [], [])).toBe(true);
    expect(isLevelUnlockedByCompleted(t3hu.id, [], [t2hu.id], [])).toBe(true);
    expect(isLevelUnlockedByCompleted(t1hu.id, [], [], [])).toBe(true);
    // 未知 Level 即使进了名单也仍判锁定（门禁不被伪造 id 绕过）
    expect(isLevelUnlockedByCompleted('t99hu', [], [], ['t99hu'])).toBe(false);
  });
});

describe('findNextTheoryChapter × legacyUnlockedLevels', () => {
  const headsUp = getLevelSummariesByVariant('heads-up');
  const coreIdsOf = (...levels: typeof headsUp) =>
    levels.flatMap((level) => getCoreChaptersOfLevel(level).map((chapter) => chapter.id));

  it('宽限命中且前序 Level 已读完时，推荐该 Level 首个核心章', () => {
    const completed = coreIdsOf(...headsUp.slice(0, 4)); // T1hu–T4hu 全完成
    const next = findNextTheoryChapter(
      progressOf({
        activeVariant: 'heads-up',
        completedChapters: completed,
        legacyUnlockedLevels: [headsUp[4]!.id],
      }),
    );
    expect(next?.id).toBe(getCoreChaptersOfLevel(headsUp[4]!)[0]!.id);
  });

  it('宽限不抢占顺序：更早 Level 的未完成章仍优先推荐', () => {
    const completed = coreIdsOf(...headsUp.slice(0, 2)); // T1hu–T2hu 全完成
    const withLegacy = findNextTheoryChapter(
      progressOf({
        activeVariant: 'heads-up',
        completedChapters: completed,
        legacyUnlockedLevels: ['t6hu'],
      }),
    );
    const withoutLegacy = findNextTheoryChapter(
      progressOf({ activeVariant: 'heads-up', completedChapters: completed }),
    );
    expect(withLegacy?.id).toBe(getCoreChaptersOfLevel(headsUp[2]!)[0]!.id);
    expect(withLegacy?.id).toBe(withoutLegacy?.id);
  });
});

describe('LEGACY_HEADS_UP_CORE_CHAPTERS（v5 历史快照）', () => {
  it('快照固定为旧单挑 22 个核心章，且每个 id 仍存在于当前数据', () => {
    const entries = Object.entries(LEGACY_HEADS_UP_CORE_CHAPTERS);
    expect(entries.flatMap(([, chapterIds]) => chapterIds)).toHaveLength(22);
    // 拼错一个 id 就会让对应 Level 的宽限静默失效，故逐个比对当前单挑目录
    const headsUpIds = new Set(
      getLevelSummariesByVariant('heads-up').flatMap((level) =>
        level.chapters.map((chapter) => chapter.id),
      ),
    );
    for (const [levelId, chapterIds] of entries) {
      expect(chapterIds.length, levelId).toBeGreaterThan(0);
      for (const chapterId of chapterIds) {
        expect(headsUpIds.has(chapterId), `${levelId} → ${chapterId}`).toBe(true);
      }
    }
  });
});

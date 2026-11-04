import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import type { TrainingRecord } from '@/shared/types/training';
import type { TheoryProgress } from './types';
import {
  findLevelSummaryById,
  getCoreChapterCount,
  getCoreChaptersOfLevel,
  getSupplementalChaptersOfLevel,
} from './utils/theoryMeta';

/**
 * theory-academy store 行为契约（单元层，Node）。
 *
 * 覆盖迁移 / persist 形状测试之外的 action 语义：
 * - startChapter：currentChapter + startedAt 只在首次写入
 * - recordChapterAttempt：首次 / 重考口径分离（attempts、firstScore 锁定、bestScore、训练事件仅首发）
 * - isTheoryLevelUnlocked：顺序解锁 + 定位免修 creditLevels + 增补章不解锁 + 调试解锁短路
 * - getLevelProgress / getTotalProgress：核心章口径（增补章与其它变体不计入）
 * - recordPlacement / recordCheckpointAttempt / toggleBookmark / saveChapterNote：v4 新字段契约
 * - switchVariant / resetProgress：变体上下文与初始形状
 *
 * 期望数值一律从 utils/theoryMeta（目录单源）推导，不在测试内硬编码章节数。
 */

type TheoryStoreModule = typeof import('./store');

let storeModule: TheoryStoreModule;
let useTheoryStore: TheoryStoreModule['useTheoryStore'];
let pristine: TheoryProgress;
let emitted: TrainingRecord[] = [];
let unsubscribe: (() => void) | undefined;

/** 目录层查询：某 Level 的核心章（缺数据即报错，避免测试静默空转） */
function coreOf(levelId: string) {
  const level = findLevelSummaryById(levelId);
  if (!level) throw new Error(`目录缺少 Level ${levelId}`);
  const core = getCoreChaptersOfLevel(level);
  if (core.length === 0) throw new Error(`Level ${levelId} 没有核心章`);
  return core;
}

function supplementalOf(levelId: string) {
  const level = findLevelSummaryById(levelId);
  if (!level) throw new Error(`目录缺少 Level ${levelId}`);
  return getSupplementalChaptersOfLevel(level);
}

function complete(chapterId: string, score = 100) {
  useTheoryStore.getState().recordChapterAttempt(chapterId, score, 3, 3);
}

beforeAll(async () => {
  // persist 默认 storage 指向 localStorage，Node 环境需内存桩
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });

  storeModule = await import('./store');
  useTheoryStore = storeModule.useTheoryStore;
  pristine = structuredClone(useTheoryStore.getState().progress);
});

beforeEach(() => {
  useTheoryStore.setState({ progress: structuredClone(pristine) });
  emitted = [];
  unsubscribe = trainingEvents.subscribe((record) => emitted.push(record));
});

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
  useDebugModeStore.setState({ unlockAll: false });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('startChapter', () => {
  it('记录当前章节，且 startedAt 只在首次进入时写入', () => {
    const [first, second] = coreOf('t1');
    expect(useTheoryStore.getState().progress.startedAt).toBe(0);

    useTheoryStore.getState().startChapter(first!.id);
    const startedAt = useTheoryStore.getState().progress.startedAt;
    expect(useTheoryStore.getState().progress.currentChapter).toBe(first!.id);
    expect(startedAt).toBeGreaterThan(0);

    useTheoryStore.getState().startChapter(second!.id);
    expect(useTheoryStore.getState().progress.currentChapter).toBe(second!.id);
    // 第二次进入不覆盖首次开始时间
    expect(useTheoryStore.getState().progress.startedAt).toBe(startedAt);
  });
});

describe('recordChapterAttempt 首次完成', () => {
  it('首次完成：章节计一次、记录分数并发出一条理论训练事件', () => {
    const chapterId = coreOf('t1')[0]!.id;
    useTheoryStore.getState().recordChapterAttempt(chapterId, 80, 4, 3);

    const { progress } = useTheoryStore.getState();
    expect(progress.completedChapters).toEqual([chapterId]);
    expect(progress.quizScores[chapterId]).toBe(80);
    expect(useTheoryStore.getState().isChapterCompleted(chapterId)).toBe(true);

    expect(emitted).toHaveLength(1);
    const record = emitted[0]!;
    expect(record.module).toBe('theory-academy');
    expect(record.mode).toBe('quiz');
    expect(record.result.totalQuestions).toBe(4);
    expect(record.result.correctAnswers).toBe(3);
    expect(record.result.accuracy).toBeCloseTo(0.75, 10);
  });

  it('首次写入完整 attempt 记录（firstScore / firstCorrect / firstTotal 锁定首次）', () => {
    const chapterId = coreOf('t1')[0]!.id;
    useTheoryStore.getState().recordChapterAttempt(chapterId, 75, 4, 3);

    const attempt = useTheoryStore.getState().progress.chapterAttempts?.[chapterId];
    expect(attempt).toMatchObject({
      attempts: 1,
      firstScore: 75,
      firstCorrect: 3,
      firstTotal: 4,
      bestScore: 75,
      lastScore: 75,
    });
    expect(attempt!.lastAt).toBeGreaterThan(0);
  });

  it('题量为 0 时准确率兜底为 0（不产生 NaN）', () => {
    const chapterId = coreOf('t1')[2]!.id;
    useTheoryStore.getState().recordChapterAttempt(chapterId, 0, 0, 0);
    expect(emitted[0]!.result.accuracy).toBe(0);
  });

  it('未完成时 isChapterCompleted 为 false', () => {
    expect(useTheoryStore.getState().isChapterCompleted(coreOf('t1')[0]!.id)).toBe(false);
  });
});

describe('recordChapterAttempt 重考', () => {
  it('重复提交幂等：不重复计数、quizScores 取历史最高、不重复发事件', () => {
    const chapterId = coreOf('t1')[1]!.id;
    complete(chapterId, 60);
    complete(chapterId, 100);
    complete(chapterId, 40);

    const { progress } = useTheoryStore.getState();
    expect(progress.completedChapters.filter((id) => id === chapterId)).toHaveLength(1);
    expect(progress.quizScores[chapterId]).toBe(100);
    expect(emitted).toHaveLength(1);
  });

  it('重考只更新练习口径：attempts 累加、bestScore 取最大、首次成绩不变', () => {
    const chapterId = coreOf('t1')[1]!.id;
    useTheoryStore.getState().recordChapterAttempt(chapterId, 60, 5, 3);
    useTheoryStore.getState().recordChapterAttempt(chapterId, 100, 5, 5);
    useTheoryStore.getState().recordChapterAttempt(chapterId, 40, 5, 2);

    const attempt = useTheoryStore.getState().progress.chapterAttempts?.[chapterId];
    expect(attempt).toMatchObject({
      attempts: 3,
      firstScore: 60,
      firstCorrect: 3,
      firstTotal: 5,
      bestScore: 100,
      lastScore: 40,
    });
    // 训练事件仅首次一条
    expect(emitted).toHaveLength(1);
  });
});

describe('isTheoryLevelUnlocked', () => {
  it('顺序解锁：T1 恒解锁，T2 需 T1 核心章全部完成', () => {
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t1')).toBe(true);
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t2')).toBe(false);

    for (const chapter of coreOf('t1')) complete(chapter.id);

    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t2')).toBe(true);
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t3')).toBe(false);
  });

  it('只完成增补章不解锁下一级（增补章不参与门禁）', () => {
    const supplemental = supplementalOf('t1');
    expect(supplemental.length).toBeGreaterThan(0);

    for (const chapter of supplemental) complete(chapter.id);

    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t2')).toBe(false);
  });

  it('定位免修 Level 直接解锁，且不写 completedChapters', () => {
    useTheoryStore.getState().recordPlacement({
      score: 70,
      correct: 11,
      total: 16,
      recommendedLevelId: 't2',
      creditLevels: ['t1'],
      completedAt: 1,
    });

    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t2')).toBe(true);
    // 免修是连续前缀：T1 免修只解锁 T2，T3 仍需 T2 核心章完成
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t3')).toBe(false);
    expect(useTheoryStore.getState().progress.completedChapters).toEqual([]);
    // 免修不影响核心进度分子
    expect(useTheoryStore.getState().getLevelProgress('t1')).toBe(0);
  });

  it('未知 Level id 不解锁', () => {
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t99')).toBe(false);
  });

  it('调试解锁短路全部 Level 门禁', () => {
    useDebugModeStore.setState({ unlockAll: true });
    for (const levelId of ['t2', 't5', 't9']) {
      expect(useTheoryStore.getState().isTheoryLevelUnlocked(levelId)).toBe(true);
    }
  });
});

describe('getLevelProgress / getTotalProgress', () => {
  it('Level 进度按核心章计算，增补章与未知 Level 不影响', () => {
    expect(useTheoryStore.getState().getLevelProgress('t1')).toBe(0);

    const core = coreOf('t1');
    complete(core[0]!.id);
    const expected = Math.round((1 / core.length) * 100);
    expect(useTheoryStore.getState().getLevelProgress('t1')).toBe(expected);

    for (const chapter of supplementalOf('t1')) complete(chapter.id);
    expect(useTheoryStore.getState().getLevelProgress('t1')).toBe(expected);
    expect(useTheoryStore.getState().getLevelProgress('t99')).toBe(0);
  });

  it('总进度按当前变体核心章计算，增补章与其它变体章节不计入', () => {
    const total = getCoreChapterCount('standard');
    expect(total).toBeGreaterThan(0);
    expect(useTheoryStore.getState().getTotalProgress()).toBe(0);

    complete(coreOf('t1')[0]!.id);
    const expected = Math.round((1 / total) * 100);
    expect(useTheoryStore.getState().getTotalProgress()).toBe(expected);

    for (const chapter of supplementalOf('t1')) complete(chapter.id);
    expect(useTheoryStore.getState().getTotalProgress()).toBe(expected);

    // 切换变体后，标准变体的已读章节不再计入总进度分母/分子
    useTheoryStore.getState().switchVariant('heads-up');
    expect(useTheoryStore.getState().getTotalProgress()).toBe(0);
  });
});

describe('recordPlacement', () => {
  it('写入定位结果，creditLevels 取并集（重测不降级、不写 completedChapters）', () => {
    useTheoryStore.getState().recordPlacement({
      score: 80,
      correct: 13,
      total: 16,
      recommendedLevelId: 't4',
      creditLevels: ['t1', 't2', 't3'],
      completedAt: 1000,
    });

    expect(useTheoryStore.getState().progress.placement).toMatchObject({
      recommendedLevelId: 't4',
      creditLevels: ['t1', 't2', 't3'],
      completedAt: 1000,
    });

    // 重测低分：推荐起点可下调，但已获得的免修 Level 不收回
    useTheoryStore.getState().recordPlacement({
      score: 30,
      correct: 5,
      total: 16,
      recommendedLevelId: 't1',
      creditLevels: ['t1'],
      completedAt: 2000,
    });

    const placement = useTheoryStore.getState().progress.placement;
    expect(placement?.recommendedLevelId).toBe('t1');
    expect(placement?.creditLevels).toEqual(['t1', 't2', 't3']);
    expect(useTheoryStore.getState().progress.completedChapters).toEqual([]);
    expect(emitted).toHaveLength(0);
  });
});

describe('recordCheckpointAttempt', () => {
  it('累加 attempts、bestScore 取最大、记录最近一次抽题 id', () => {
    useTheoryStore.getState().recordCheckpointAttempt('t1', { score: 70, questionIds: ['a', 'b'] });
    useTheoryStore.getState().recordCheckpointAttempt('t1', { score: 50, questionIds: ['c'] });

    const checkpoint = useTheoryStore.getState().progress.checkpoints?.['t1'];
    expect(checkpoint).toMatchObject({
      attempts: 2,
      bestScore: 70,
      lastScore: 50,
      questionIds: ['c'],
    });
    expect(checkpoint!.lastAt).toBeGreaterThan(0);
    // checkpoint 为形成性测评：不解锁、不发训练事件
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t2')).toBe(false);
    expect(emitted).toHaveLength(0);
  });
});

describe('toggleBookmark', () => {
  it('幂等切换：加入一次、移除一次', () => {
    const chapterId = coreOf('t1')[0]!.id;
    useTheoryStore.getState().toggleBookmark(chapterId);
    expect(useTheoryStore.getState().progress.bookmarkedChapters).toEqual([chapterId]);

    useTheoryStore.getState().toggleBookmark(chapterId);
    expect(useTheoryStore.getState().progress.bookmarkedChapters).toEqual([]);
    // 收藏不改动完成状态
    expect(useTheoryStore.getState().isChapterCompleted(chapterId)).toBe(false);
  });
});

describe('saveChapterNote', () => {
  it('trim + 2000 字上限 + updatedAt 写入', () => {
    const chapterId = coreOf('t1')[0]!.id;
    useTheoryStore.getState().saveChapterNote(chapterId, '  三条街的底池控制  ');

    const note = useTheoryStore.getState().progress.chapterNotes?.[chapterId];
    expect(note?.text).toBe('三条街的底池控制');
    expect(note!.updatedAt).toBeGreaterThan(0);

    const longText = 'x'.repeat(storeModule.MAX_CHAPTER_NOTE_LENGTH + 100);
    useTheoryStore.getState().saveChapterNote(chapterId, longText);
    expect(useTheoryStore.getState().progress.chapterNotes?.[chapterId]?.text).toHaveLength(
      storeModule.MAX_CHAPTER_NOTE_LENGTH,
    );
  });
});

describe('switchVariant', () => {
  it('切换变体写入 activeVariant 并只刷新目标变体的 lastViewedAt', () => {
    const before = useTheoryStore.getState().progress.variantMetadata!;

    useTheoryStore.getState().switchVariant('short-deck');
    const after = useTheoryStore.getState().progress;

    expect(after.activeVariant).toBe('short-deck');
    expect(after.variantMetadata!['short-deck'].lastViewedAt).toBeGreaterThan(0);
    expect(after.variantMetadata!['short-deck'].preferredOrder).toBe(
      before['short-deck'].preferredOrder,
    );
    expect(after.variantMetadata!.standard).toEqual(before.standard);
    expect(after.variantMetadata!['heads-up']).toEqual(before['heads-up']);
  });

  it('variantMetadata 缺失（异常旧数据）时回退默认元数据', () => {
    useTheoryStore.setState({ progress: { ...pristine, variantMetadata: undefined } });

    useTheoryStore.getState().switchVariant('heads-up');
    const metadata = useTheoryStore.getState().progress.variantMetadata!;

    expect(Object.keys(metadata).toSorted()).toEqual(['heads-up', 'short-deck', 'standard']);
    expect(metadata['heads-up'].preferredOrder).toBe(2);
    expect(metadata['heads-up'].lastViewedAt).toBeGreaterThan(0);
  });

  it('目标变体缺少元数据条目时按 preferredOrder 0 注入', () => {
    const partial = {
      standard: { lastViewedAt: 5, preferredOrder: 0 },
      'short-deck': { lastViewedAt: 0, preferredOrder: 1 },
    } as unknown as TheoryProgress['variantMetadata'];
    useTheoryStore.setState({ progress: { ...pristine, variantMetadata: partial } });

    useTheoryStore.getState().switchVariant('heads-up');
    const metadata = useTheoryStore.getState().progress.variantMetadata!;

    expect(metadata['heads-up'].preferredOrder).toBe(0);
    expect(metadata['heads-up'].lastViewedAt).toBeGreaterThan(0);
  });
});

describe('resetProgress', () => {
  it('清空章节 / 分数 / 标记 / v4 学习工具与变体上下文，回到初始形状', () => {
    const chapterId = coreOf('t1')[0]!.id;
    useTheoryStore.getState().startChapter(chapterId);
    complete(chapterId);
    useTheoryStore.getState().toggleFlagQuestion(`${chapterId}-q1`);
    useTheoryStore.getState().toggleBookmark(chapterId);
    useTheoryStore.getState().saveChapterNote(chapterId, 'note');
    useTheoryStore.getState().recordCheckpointAttempt('t1', { score: 60, questionIds: ['q1'] });
    useTheoryStore.getState().switchVariant('short-deck');

    useTheoryStore.getState().resetProgress();
    const { progress } = useTheoryStore.getState();

    expect(progress.completedChapters).toEqual([]);
    expect(progress.quizScores).toEqual({});
    expect(progress.currentChapter).toBeNull();
    expect(progress.startedAt).toBe(0);
    expect(progress.flaggedQuestions).toEqual([]);
    expect(progress.activeVariant).toBe('standard');
    expect(progress.chapterAttempts).toEqual({});
    expect(progress.checkpoints).toEqual({});
    expect(progress.placement).toBeUndefined();
    expect(progress.bookmarkedChapters).toEqual([]);
    expect(progress.chapterNotes).toEqual({});
    // action 不因重置丢失
    expect(typeof useTheoryStore.getState().recordChapterAttempt).toBe('function');
  });
});

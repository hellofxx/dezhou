import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';
import { trainingEvents } from '@/shared/stores/trainingEvents';

/**
 * theory-academy store persist migrate 冒烟测试（v0 → v1）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('theory-academy store migrate (v0 → v1)', () => {
  it('v0 数据 progress 部分缺失时防御性合并默认值，已有字段不被触碰', async () => {
    const storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          // 模拟异常旧数据：progress 只有部分字段
          progress: {
            completedChapters: ['t1-combinatorics'],
            quizScores: { 't1-combinatorics': 80 },
          },
        },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useTheoryStore } = await import('./store');
    const state = useTheoryStore.getState();

    // v1: 缺失字段被注入默认值
    expect(state.progress.currentChapter).toBeNull();
    expect(state.progress.startedAt).toBe(0);
    // 已有字段不被触碰
    expect(state.progress.completedChapters).toEqual(['t1-combinatorics']);
    expect(state.progress.quizScores).toEqual({ 't1-combinatorics': 80 });
    // v4 兜底：越级迁移同样补齐新字段并通过 quizScores 种子化 attempts
    expect(state.progress.chapterAttempts?.['t1-combinatorics']?.attempts).toBe(1);
    expect(state.progress.bookmarkedChapters).toEqual([]);
    // 迁移后 action 可正常读取旧数据
    expect(state.isChapterCompleted('t1-combinatorics')).toBe(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });
});

/**
 * theory-academy store persist migrate 测试（v1 → v2）。
 * 预置 v1 数据（无 flaggedQuestions 字段）触发 rehydrate，
 * 验证 migrate 注入默认值且原有进度不丢失。
 */
describe('theory-academy store migrate (v1 → v2)', () => {
  let storageStub: ReturnType<typeof createLocalStorageStub>;

  beforeEach(() => {
    storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          progress: {
            completedChapters: ['t1-combinatorics'],
            quizScores: { 't1-combinatorics': 80 },
            currentChapter: 't1-combinatorics',
            startedAt: 1000,
          },
        },
        1
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('v1 数据迁移后注入 flaggedQuestions 默认值且保留原有进度', async () => {
    const { useTheoryStore } = await import('./store');
    const { progress } = useTheoryStore.getState();
    expect(progress.flaggedQuestions).toEqual([]);
    expect(progress.completedChapters).toEqual(['t1-combinatorics']);
    expect(progress.quizScores['t1-combinatorics']).toBe(80);
    expect(progress.currentChapter).toBe('t1-combinatorics');
    expect(progress.startedAt).toBe(1000);
  });

  it('toggleFlagQuestion 幂等切换', async () => {
    const { useTheoryStore } = await import('./store');
    const { toggleFlagQuestion } = useTheoryStore.getState();
    toggleFlagQuestion('t1-combinatorics-q1');
    expect(useTheoryStore.getState().progress.flaggedQuestions).toEqual(['t1-combinatorics-q1']);
    toggleFlagQuestion('t1-combinatorics-q1');
    expect(useTheoryStore.getState().progress.flaggedQuestions).toEqual([]);
    // 迁移数据不受 toggle 影响（flag 后原有字段保持）
    expect(useTheoryStore.getState().progress.completedChapters).toEqual(['t1-combinatorics']);
  });
});

/**
 * theory-academy store persist migrate 测试（v2 → v3）。
 * 预置 v2 数据（无 activeVariant / variantMetadata 字段）触发 rehydrate，
 * 验证 migrate 注入变体上下文字段默认值且原有进度不丢失。
 */
describe('theory-academy store migrate (v2 → v3)', () => {
  let storageStub: ReturnType<typeof createLocalStorageStub>;

  beforeEach(() => {
    storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          progress: {
            completedChapters: ['t1-combinatorics', 't1-outs'],
            quizScores: { 't1-combinatorics': 80, 't1-outs': 100 },
            currentChapter: 't1-outs',
            startedAt: 2000,
            flaggedQuestions: ['t1-combinatorics-q2'],
          },
        },
        2
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('v2 数据迁移后注入 activeVariant=standard 与 variantMetadata 默认值且保留原有进度', async () => {
    const { useTheoryStore } = await import('./store');
    const { progress } = useTheoryStore.getState();
    expect(progress.activeVariant).toBe('standard');
    expect(progress.variantMetadata).toEqual({
      standard: { lastViewedAt: expect.any(Number), preferredOrder: 0 },
      'short-deck': { lastViewedAt: 0, preferredOrder: 1 },
      'heads-up': { lastViewedAt: 0, preferredOrder: 2 },
    });
    // 原有进度完整保留
    expect(progress.completedChapters).toEqual(['t1-combinatorics', 't1-outs']);
    expect(progress.quizScores['t1-outs']).toBe(100);
    expect(progress.currentChapter).toBe('t1-outs');
    expect(progress.startedAt).toBe(2000);
    expect(progress.flaggedQuestions).toEqual(['t1-combinatorics-q2']);
  });
});

/**
 * theory-academy store persist migrate 测试（v3 → v4）。
 * v4 新增 chapterAttempts / checkpoints / placement / bookmarkedChapters / chapterNotes：
 * - quizScores 种子化为 attempts=1 的尝试记录（老完成章不得被判为首次 → 不重复 emit 事件）；
 * - 其余新字段注入防御性默认值；
 * - 老用户 completedChapters / quizScores / 变体上下文零丢失。
 */
describe('theory-academy store migrate (v3 → v4)', () => {
  let storageStub: ReturnType<typeof createLocalStorageStub>;

  beforeEach(() => {
    storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload(
        {
          progress: {
            completedChapters: ['t1-combinatorics', 't1-outs'],
            quizScores: { 't1-combinatorics': 80, 't1-outs': 100 },
            currentChapter: 't1-outs',
            startedAt: 2000,
            flaggedQuestions: ['t1-combinatorics-q2'],
            activeVariant: 'short-deck',
            variantMetadata: {
              standard: { lastViewedAt: 11, preferredOrder: 0 },
              'short-deck': { lastViewedAt: 22, preferredOrder: 1 },
              'heads-up': { lastViewedAt: 0, preferredOrder: 2 },
            },
          },
        },
        3
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('quizScores 种子化为 attempts=1 的记录，老进度与变体上下文零丢失', async () => {
    const { useTheoryStore } = await import('./store');
    const { progress } = useTheoryStore.getState();

    expect(progress.chapterAttempts).toEqual({
      't1-combinatorics': {
        attempts: 1,
        firstScore: 80,
        firstCorrect: 0,
        firstTotal: 0,
        bestScore: 80,
        lastScore: 80,
        lastAt: 0,
      },
      't1-outs': {
        attempts: 1,
        firstScore: 100,
        firstCorrect: 0,
        firstTotal: 0,
        bestScore: 100,
        lastScore: 100,
        lastAt: 0,
      },
    });
    expect(progress.checkpoints).toEqual({});
    expect(progress.placement).toBeUndefined();
    expect(progress.bookmarkedChapters).toEqual([]);
    expect(progress.chapterNotes).toEqual({});

    expect(progress.completedChapters).toEqual(['t1-combinatorics', 't1-outs']);
    expect(progress.quizScores).toEqual({ 't1-combinatorics': 80, 't1-outs': 100 });
    expect(progress.currentChapter).toBe('t1-outs');
    expect(progress.startedAt).toBe(2000);
    expect(progress.flaggedQuestions).toEqual(['t1-combinatorics-q2']);
    expect(progress.activeVariant).toBe('short-deck');
    expect(progress.variantMetadata?.standard.lastViewedAt).toBe(11);
    expect(progress.variantMetadata?.['short-deck'].lastViewedAt).toBe(22);
  });

  it('迁移后的已完成章再提交视为重考：不重复 emit 事件、首次成绩不被覆盖', async () => {
    const { useTheoryStore } = await import('./store');
    const emitted: unknown[] = [];
    const unsubscribe = trainingEvents.subscribe((record) => emitted.push(record));

    useTheoryStore.getState().recordChapterAttempt('t1-combinatorics', 40, 5, 2);
    unsubscribe();

    const attempt = useTheoryStore.getState().progress.chapterAttempts?.['t1-combinatorics'];
    expect(emitted).toHaveLength(0);
    expect(attempt).toMatchObject({ attempts: 2, firstScore: 80, lastScore: 40, bestScore: 80 });
    // 兼容字段仍取历史最高分
    expect(useTheoryStore.getState().progress.quizScores['t1-combinatorics']).toBe(80);
  });
});

/**
 * theory-academy store persist migrate 测试（v4 → v5）。
 * v5 为单挑（heads-up）新增 15 个核心章引入一次性宽限：
 * 用历史快照（旧核心章 id）推导 legacyUnlockedLevels，只放宽解锁、绝不写 completedChapters，
 * 使开发 / 灰度期间存量用户不因「前一 Level 核心章不全」被重新上锁。
 */
describe('theory-academy store migrate (v4 → v5)', () => {
  const LEGACY_T4 = ['t4hu-range-width', 't4hu-polarization', 't4hu-blocking'];
  const LEGACY_T5 = ['t5hu-gto-he', 't5hu-frequency'];

  /** 预置 v4 数据触发 rehydrate，返回迁移后的 store */
  async function migrateFromV4(progress: Record<string, unknown>) {
    const storageStub = createLocalStorageStub({
      'theory-academy-progress': buildPersistPayload({ progress }, 4),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    const { useTheoryStore } = await import('./store');
    return useTheoryStore;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('旧 T4 核心章全完成 → 宽限 t5hu，完成记录不被写入', async () => {
    const store = await migrateFromV4({ completedChapters: LEGACY_T4 });
    const { progress, isTheoryLevelUnlocked } = store.getState();

    expect(progress.legacyUnlockedLevels).toEqual(['t5hu']);
    // 只写宽限名单：completedChapters 保持原样，新章仍未被记为完成
    expect(progress.completedChapters).toEqual(LEGACY_T4);
    expect(isTheoryLevelUnlocked('t5hu')).toBe(true);
  });

  it('旧 T5 核心章全完成 → 宽限 t6hu；两级都完成时同时宽限', async () => {
    const onlyT5 = await migrateFromV4({ completedChapters: LEGACY_T5 });
    expect(onlyT5.getState().progress.legacyUnlockedLevels).toEqual(['t6hu']);

    vi.unstubAllGlobals();
    vi.resetModules();

    const both = await migrateFromV4({ completedChapters: [...LEGACY_T4, ...LEGACY_T5] });
    expect(both.getState().progress.legacyUnlockedLevels).toEqual(['t5hu', 't6hu']);
  });

  it('前一 Level 缺章（部分完成）→ 不宽限，且不链式放宽', async () => {
    // T4 缺 range-width → 无 t5hu；T5 缺 frequency → 无 t6hu
    const store = await migrateFromV4({
      completedChapters: ['t4hu-polarization', 't4hu-blocking', 't5hu-gto-he'],
    });
    const { progress, isTheoryLevelUnlocked } = store.getState();

    expect(progress.legacyUnlockedLevels).toEqual([]);
    expect(isTheoryLevelUnlocked('t5hu')).toBe(false);
    expect(isTheoryLevelUnlocked('t6hu')).toBe(false);
  });

  it('新用户（无完成记录）→ 空名单', async () => {
    const store = await migrateFromV4({});
    const { progress } = store.getState();

    expect(progress.legacyUnlockedLevels).toEqual([]);
    expect(progress.completedChapters).toEqual([]);
  });

  it('已定义 legacyUnlockedLevels 时原样保留（不重算、不清空）', async () => {
    const store = await migrateFromV4({
      completedChapters: LEGACY_T4,
      legacyUnlockedLevels: ['t7hu'],
    });

    expect(store.getState().progress.legacyUnlockedLevels).toEqual(['t7hu']);
  });
});

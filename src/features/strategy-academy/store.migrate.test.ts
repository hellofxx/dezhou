import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store persist migrate 冒烟测试（v0 → v8）。
 * 通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移。
 */
describe('strategy-academy store migrate (v0 → v8)', () => {
  it('v0 数据完成全链路迁移：旧镜像字段被清理，已有字段不被触碰', async () => {
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            completedDrills: [],
            currentLevel: 1,
            totalStudyMinutes: 0,
          },
        },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v8: 首末次得分镜像字段已删除（进步回放改读 lessonAttempts）
    expect(state).not.toHaveProperty('firstAttemptScores');
    expect(state).not.toHaveProperty('lastAttemptScores');
    expect(state).not.toHaveProperty('abilityAssessment');
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
  });
});

describe('strategy-academy store migrate (v3 → v4)', () => {
  it('v3 数据补齐 completedUnits 默认空映射，已有字段不被触碰', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: { 'l1-hand-rankings': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
          },
        },
        3
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v4: 注入小节完成记录默认空映射
    expect(state.progress.completedUnits).toEqual({});
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
    expect(state.progress.quizScores).toEqual({ 'l1-hand-rankings': 90 });
  });

  it('v4 数据已有 completedUnits 不被 migrate 覆盖', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: { 'l1-hand-rankings': ['u1', 'u2'] },
          },
        },
        4
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    expect(state.progress.completedUnits).toEqual({ 'l1-hand-rankings': ['u1', 'u2'] });
  });
});

describe('strategy-academy store migrate (v4 → v5)', () => {
  it('v4 数据注入 activeVariant 默认值 standard，已有字段不被触碰', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-hand-rankings'],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
        },
        4
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    // v5: 注入变体上下文默认值
    expect(state.activeVariant).toBe('standard');
    // 已有字段不被触碰
    expect(state.progress.completedLessons).toEqual(['l1-hand-rankings']);
  });

  it('v5 数据已有 activeVariant 不被 migrate 覆盖', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: [],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          activeVariant: 'short-deck',
        },
        5
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    expect(state.activeVariant).toBe('short-deck');
  });
});

describe('strategy-academy store migrate (v5 → v6)', () => {
  it('由旧分数镜像反推 lessonAttempts，首考/末考/最高分保持', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-basics'],
            quizScores: { 'l1-basics': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          firstAttemptScores: { 'l1-basics': 80 },
          lastAttemptScores: { 'l1-basics': 90 },
        },
        5
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const { findLessonSummaryById } = await import('./utils/academyMeta');
    const quizTotal = findLessonSummaryById('l1-basics')?.quizCount ?? 0;
    const attempt = useAcademyStore.getState().lessonAttempts['l1-basics'];

    expect(attempt).toMatchObject({
      attempts: 1,
      firstScore: 80,
      firstCorrect: Math.round((80 / 100) * quizTotal),
      firstTotal: quizTotal,
      bestScore: 90,
      lastScore: 90,
    });
    expect(attempt?.lastAt).toEqual(expect.any(Number));
  });

  it('已完成但无分数的课时补 attempts=1，避免重考被误判为首次', async () => {
    vi.resetModules();
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-basics'],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
        },
        5
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const { findLessonSummaryById } = await import('./utils/academyMeta');
    const quizTotal = findLessonSummaryById('l1-basics')?.quizCount ?? 0;
    const attempt = useAcademyStore.getState().lessonAttempts['l1-basics'];

    expect(attempt).toMatchObject({
      attempts: 1,
      firstScore: 0,
      firstTotal: quizTotal,
      bestScore: 0,
      lastScore: 0,
    });
  });

  it('已有 lessonAttempts 不被迁移覆盖', async () => {
    vi.resetModules();
    const existing = {
      attempts: 3,
      firstScore: 70,
      firstCorrect: 2,
      firstTotal: 3,
      bestScore: 90,
      lastScore: 80,
      lastAt: 1700000000000,
    };
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-basics'],
            quizScores: { 'l1-basics': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          lessonAttempts: { 'l1-basics': existing },
        },
        5
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    expect(useAcademyStore.getState().lessonAttempts['l1-basics']).toEqual(existing);
  });
});

describe('strategy-academy store migrate (v6 → v7)', () => {
  it('v6 数据注入 P2 默认值，已有 lessonAttempts 保留', async () => {
    vi.resetModules();
    const existing = {
      attempts: 2,
      firstScore: 70,
      firstCorrect: 2,
      firstTotal: 3,
      bestScore: 90,
      lastScore: 80,
      lastAt: 1700000000000,
    };
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-basics'],
            quizScores: { 'l1-basics': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          lessonAttempts: { 'l1-basics': existing },
        },
        6
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();
    expect(state.lessonAttempts['l1-basics']).toEqual(existing);
    expect(state.placement).toBeNull();
    expect(state.checkpoints).toEqual({});
    expect(state.bookmarkedLessons).toEqual([]);
    expect(state.lessonNotes).toEqual({});
  });

  it('已有 P2 字段不被迁移覆盖', async () => {
    vi.resetModules();
    const placement = {
      recommendedLevelId: 'l2',
      creditLevels: ['l1'],
      correct: 6,
      total: 16,
      takenAt: 1700000000000,
    };
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: [],
            quizScores: {},
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: {},
          },
          placement,
          bookmarkedLessons: ['l1-basics'],
          lessonNotes: { 'l1-basics': { text: 'note', updatedAt: 1700000000000 } },
        },
        6
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();
    expect(state.placement).toEqual(placement);
    expect(state.bookmarkedLessons).toEqual(['l1-basics']);
    expect(state.lessonNotes['l1-basics']?.text).toBe('note');
  });
});

describe('strategy-academy store migrate (v7 → v8)', () => {
  it('删除 abilityAssessment 与首末次得分镜像，保留 lessonAttempts/认证/进度/P2 字段', async () => {
    vi.resetModules();
    const attempt = {
      attempts: 2,
      firstScore: 70,
      firstCorrect: 2,
      firstTotal: 3,
      bestScore: 90,
      lastScore: 80,
      lastAt: 1700000000000,
    };
    const cert = {
      level: 1,
      requiredAccuracy: 70,
      cooldownPeriod: 24,
      questionCount: 20,
      timeLimit: 0,
      attempts: 1,
      certifiedAt: 1700000000000,
      validUntil: 1800000000000,
      variant: 'standard',
    };
    const placement = {
      recommendedLevelId: 'l2',
      creditLevels: ['l1'],
      correct: 6,
      total: 16,
      takenAt: 1700000000000,
    };
    const storageStub = createLocalStorageStub({
      'strategy-academy-progress': buildPersistPayload(
        {
          progress: {
            completedLessons: ['l1-basics'],
            quizScores: { 'l1-basics': 90 },
            currentLesson: null,
            startedAt: 1700000000000,
            completedUnits: { 'l1-basics': ['u1'] },
          },
          abilityAssessment: {
            rangeKnowledge: 80,
            oddsCalculation: 70,
            gtoUnderstanding: 60,
            positionalPlay: 75,
            emotionalControl: 50,
            lastUpdated: 1700000000000,
          },
          firstAttemptScores: { 'l1-basics': 70 },
          lastAttemptScores: { 'l1-basics': 80 },
          lessonAttempts: { 'l1-basics': attempt },
          certifications: { 1: cert },
          placement,
          checkpoints: { 1: { attempts: 1, firstScore: 75, bestScore: 75, lastScore: 75, questionIds: ['q1'], lastAt: 1700000000000 } },
          bookmarkedLessons: ['l1-basics'],
          lessonNotes: { 'l1-basics': { text: 'note', updatedAt: 1700000000000 } },
        },
        7
      ),
    });
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const state = useAcademyStore.getState();

    expect(state).not.toHaveProperty('abilityAssessment');
    expect(state).not.toHaveProperty('firstAttemptScores');
    expect(state).not.toHaveProperty('lastAttemptScores');
    expect(state.lessonAttempts['l1-basics']).toEqual(attempt);
    expect(state.certifications[1]).toMatchObject(cert);
    expect(state.progress.completedLessons).toEqual(['l1-basics']);
    expect(state.progress.completedUnits).toEqual({ 'l1-basics': ['u1'] });
    expect(state.placement).toEqual(placement);
    expect(state.checkpoints[1]?.firstScore).toBe(75);
    expect(state.bookmarkedLessons).toEqual(['l1-basics']);
    expect(state.lessonNotes['l1-basics']?.text).toBe('note');
  });
});

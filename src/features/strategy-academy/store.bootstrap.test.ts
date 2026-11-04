import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy 启动引导契约（依赖倒置 P2-2 / P3）：
 * - 向 achievementRegistry 注册成就数据源（id upsert，幂等）
 * - 向 academyDataSourceRegistry 注册课程数据源（下一课 / 元数据 / lessonAttempts 快照 / 订阅）
 * - 启动时把 progress 的 onboarding.initialAbility 四维（emotionalControl=50）播种初始 ELO
 *   （仅 gamesPlayed === 0 时由 progress store 内部判定）
 */

describe('strategy-academy store.bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function bootstrap() {
    const bootstrapModule = await import('./store.bootstrap');
    const academy = await import('./store');
    const meta = await import('./utils/academyMeta');
    const achievements = await import('@/shared/stores/achievementRegistry');
    const academySource = await import('@/shared/stores/academyDataSourceRegistry');
    const progress = await import('@/features/progress/store');
    return { ...bootstrapModule, ...academy, ...meta, ...achievements, ...academySource, ...progress };
  }

  it('注册成就数据源（id = strategy-academy，重复导入不重复累积）', async () => {
    const mod = await bootstrap();
    const sources = mod
      .getAchievementSources()
      .filter((source) => (source as unknown as { id?: string }).id === 'strategy-academy');
    expect(sources).toHaveLength(1);

    const source = sources[0]!;
    // 同 id 再次注册走 upsert（不累积重复数据源）
    mod.registerAchievementSource({ id: 'strategy-academy', ...source });
    const afterUpsert = mod
      .getAchievementSources()
      .filter((candidate) => (candidate as unknown as { id?: string }).id === 'strategy-academy');
    expect(afterUpsert).toHaveLength(1);
    expect(source.getCertifications()).toEqual({});
    expect(source.areAllLevelsCertified()).toBe(false);
    expect(source.isTrackCompleted('not-a-track')).toBe(false);
    expect(source.isLevelLessonsCompleted(99)).toBe(false);
  });

  it('成就数据源实时读取 academy store 状态', async () => {
    const mod = await bootstrap();
    const source = mod
      .getAchievementSources()
      .find((candidate) => (candidate as unknown as { id?: string }).id === 'strategy-academy')!;
    for (const lesson of mod.getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons)) {
      mod.useAcademyStore.getState().completeLesson(lesson.id);
    }
    mod.useAcademyStore.getState().submitCertificationAttempt(1, {
      score: 95,
      totalQuestions: 20,
    });
    expect(source.getCertifications()[1]?.certifiedAt).toBeDefined();
    expect(source.isLevelLessonsCompleted(99)).toBe(false);
  });

  it('课程数据源：findNextLesson 按标准序列返回首个未完成课程', async () => {
    const mod = await bootstrap();
    const dataSource = mod.getAcademyDataSource();
    expect(dataSource).toBeDefined();

    const allSummaries = mod.getAllLessonSummaries();
    const first = dataSource!.findNextLesson([]);
    expect(first).toEqual({
      id: allSummaries[0]!.id,
      title: allSummaries[0]!.title,
      level: allSummaries[0]!.level,
    });

    const second = dataSource!.findNextLesson([allSummaries[0]!.id]);
    expect(second?.id).toBe(allSummaries[1]!.id);

    expect(dataSource!.findNextLesson(allSummaries.map((l) => l.id))).toBeNull();
  });

  it('课程数据源：getLessonMeta 命中标准课程，未知 id 返回 undefined', async () => {
    const mod = await bootstrap();
    const dataSource = mod.getAcademyDataSource()!;
    const meta = dataSource.getLessonMeta('l1-basics');
    expect(meta).toEqual({ id: 'l1-basics', title: '德州扑克规则与牌型', level: 1 });
    expect(dataSource.getLessonMeta('not-a-real-lesson')).toBeUndefined();
  });

  it('课程数据源：lessonAttempts 快照按源引用缓存，课程进度为 store 稳定字段引用', async () => {
    const mod = await bootstrap();
    const dataSource = mod.getAcademyDataSource()!;
    const progress = mod.useAcademyStore.getState().progress;
    expect(dataSource.getAcademyProgressSnapshot()).toBe(progress);

    // 空 attempts → 返回稳定空快照（同引用）
    expect(dataSource.getLessonAttemptsSnapshot()).toBe(dataSource.getLessonAttemptsSnapshot());

    mod.useAcademyStore.getState().recordLessonAttempt('l1-basics', {
      score: 80,
      correct: 4,
      total: 5,
    });
    const snapshot = dataSource.getLessonAttemptsSnapshot();
    expect(snapshot['l1-basics']).toEqual({ firstScore: 80, lastScore: 80, attempts: 1 });
    // 未变更时重复读取返回同一引用（useSyncExternalStore 契约）
    expect(dataSource.getLessonAttemptsSnapshot()).toBe(snapshot);

    mod.useAcademyStore.getState().recordLessonAttempt('l1-basics', {
      score: 60,
      correct: 3,
      total: 5,
    });
    expect(dataSource.getLessonAttemptsSnapshot()['l1-basics']).toEqual({
      firstScore: 80,
      lastScore: 60,
      attempts: 2,
    });
  });

  it('课程数据源：subscribe 在 academy 状态变化时通知，取消后不再通知', async () => {
    const mod = await bootstrap();
    const dataSource = mod.getAcademyDataSource()!;
    const listener = vi.fn();
    const unsubscribe = dataSource.subscribe(listener);

    mod.useAcademyStore.getState().setActiveTrack('track-beginner');
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    mod.useAcademyStore.getState().setActiveTrack(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('默认 onboarding 能力（50）时启动宏任务不写 ELO', async () => {
    const mod = await bootstrap();
    const before = mod.useProgressStore.getState().eloByVariant.standard;
    vi.runAllTimers();
    const after = mod.useProgressStore.getState().eloByVariant.standard;
    // 默认 onboarding.initialAbility 全为 50 → 播种守卫短路，不写入
    expect(after).toEqual(before);
    expect(after.gamesPlayed).toBe(0);
  });

  it('onboarding 定位结果非默认时播种初始 ELO（emotionalControl 固定 50）', async () => {
    const mod = await bootstrap();
    const before = mod.useProgressStore.getState().eloByVariant.standard;

    const initialAbility = {
      rangeKnowledge: 80,
      oddsCalculation: 70,
      gtoUnderstanding: 60,
      positionalPlay: 75,
    };
    mod.useProgressStore.setState({
      onboarding: {
        ...mod.useProgressStore.getState().onboarding,
        initialAbility,
      },
    });

    vi.runAllTimers();
    const after = mod.useProgressStore.getState().eloByVariant.standard;
    const expected = mod.mapAcademyAbilityToElo({
      ...initialAbility,
      emotionalControl: 50,
      lastUpdated: Date.now(),
    });
    expect(after.variant).toBe('standard');
    expect(after.gamesPlayed).toBe(0);
    expect(after.math).toBe(expected.math);
    expect(after.mental).toBe(expected.mental);
    expect(after.overall).toBe(expected.overall);
    expect(after).not.toEqual(before);
  });

  it('gamesPlayed > 0 时不再播种，避免覆盖已累积 ELO', async () => {
    const mod = await bootstrap();
    mod.useProgressStore.getState().updateElo('preflop', true, 0.5);
    const before = mod.useProgressStore.getState().eloByVariant.standard;

    mod.useProgressStore.setState({
      onboarding: {
        ...mod.useProgressStore.getState().onboarding,
        initialAbility: {
          rangeKnowledge: 90,
          oddsCalculation: 90,
          gtoUnderstanding: 90,
          positionalPlay: 90,
        },
      },
    });
    vi.runAllTimers();

    expect(mod.useProgressStore.getState().eloByVariant.standard).toEqual(before);
  });
});

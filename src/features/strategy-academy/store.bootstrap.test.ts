import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy 启动引导契约（依赖倒置 P2-2 / P3）：
 * - 向 achievementRegistry 注册成就数据源（id upsert，幂等）
 * - 向 academyDataSourceRegistry 注册课程数据源（下一课 / 元数据 / 快照 / 订阅）
 * - 启动时把能力评估同步为初始 ELO（仅 gamesPlayed === 0 时由 progress store 内部判定）
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
    await import('./store.bootstrap');
    const academy = await import('./store');
    const meta = await import('./utils/academyMeta');
    const achievements = await import('@/shared/stores/achievementRegistry');
    const academySource = await import('@/shared/stores/academyDataSourceRegistry');
    const progress = await import('@/features/progress/store');
    return { ...academy, ...meta, ...achievements, ...academySource, ...progress };
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
    mod.useAcademyStore.getState().attemptCertification(1, 95);
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

  it('课程数据源：进度快照为 store 稳定字段引用（禁止合成新对象）', async () => {
    const mod = await bootstrap();
    const dataSource = mod.getAcademyDataSource()!;
    const progress = mod.useAcademyStore.getState().progress;
    expect(dataSource.getAcademyProgressSnapshot()).toBe(progress);
    expect(dataSource.getFirstAttemptScoresSnapshot()).toBe(
      mod.useAcademyStore.getState().firstAttemptScores,
    );
    expect(dataSource.getLastAttemptScoresSnapshot()).toBe(
      mod.useAcademyStore.getState().lastAttemptScores,
    );
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

  it('启动宏任务触发 ELO 同步且不覆盖已有对局进度', async () => {
    const mod = await bootstrap();
    const before = mod.useProgressStore.getState().eloByVariant.standard;
    vi.runAllTimers();
    const after = mod.useProgressStore.getState().eloByVariant.standard;
    // 默认能力评估为 50（非个性化）→ progress store 内部 hasNonDefaultAbility 短路，不写入
    expect(after).toEqual(before);
    expect(after.gamesPlayed).toBe(0);
  });

  it('能力评估非默认时启动同步初始 ELO（gamesPlayed 仍为 0）', async () => {
    const mod = await bootstrap();
    const before = mod.useProgressStore.getState().eloByVariant.standard;

    // 经唯一写入入口 updateAbility 抬高能力评估（默认值 50 时进度侧短路不写入）
    mod.useAcademyStore
      .getState()
      .updateAbility({ isCorrect: true, timeTaken: 3, difficulty: 'beginner' });
    const ability = mod.useAcademyStore.getState().abilityAssessment;
    expect(mod.hasNonDefaultAbility(ability)).toBe(true);

    vi.runAllTimers();
    const after = mod.useProgressStore.getState().eloByVariant.standard;
    const expected = mod.mapAcademyAbilityToElo(ability);
    expect(after.variant).toBe('standard');
    expect(after.gamesPlayed).toBe(0);
    expect(after.math).toBe(expected.math);
    expect(after.overall).toBe(expected.overall);
    expect(after).not.toEqual(before);
  });
});

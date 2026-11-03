/**
 * puzzle-trainer 启动引导单元测试（store.bootstrap.ts）。
 *
 * 契约（依赖倒置 P2-2）：本模块向 achievementRegistry 注册成就数据源，
 * progress store 的成就检查经注册表查询，不再反向 import 本模块。
 *  - 注册 id 为 'puzzle-trainer' 且仅一条（重复执行不累积）；
 *  - hasPuzzleHistory / hasCompletedDailyPuzzle / isDailyPuzzleCompleted 读 store 实时状态；
 *  - 非 puzzle 语义的接口返回中性值（false / 空对象），供 progress 遍历调用。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { getAchievementSources } from '@/shared/stores/achievementRegistry';
import type { AchievementDataSource } from '@/shared/types/achievementDataSource';

// zustand persist 默认 storage 引用 window.localStorage，需在 import store 前 stub
const storageStub = createLocalStorageStub();
vi.stubGlobal('localStorage', storageStub);
vi.stubGlobal('window', { localStorage: storageStub });

// 导入即注册（与 src/main.tsx 的启动顺序一致）
await import('./store.bootstrap');
const { usePuzzleStore } = await import('./store');

/** 注册表条目运行期带 id（TypeScript 接口未声明，见 achievementRegistry.RegistryItem） */
type RegisteredSource = AchievementDataSource & { id: string };

const registeredSources = () => getAchievementSources() as readonly RegisteredSource[];

const puzzleSource = () =>
  registeredSources().find((source) => source.id === 'puzzle-trainer');

const requireSource = () => {
  const source = puzzleSource();
  if (!source) throw new Error('puzzle-trainer achievement source 未注册');
  return source;
};

describe('store.bootstrap 成就数据源注册', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('注册表中存在 id=puzzle-trainer 且只有一条（upsert 幂等）', () => {
    expect(registeredSources().filter((s) => s.id === 'puzzle-trainer')).toHaveLength(1);
    expect(puzzleSource()?.hasPuzzleHistory).toBeTypeOf('function');
    expect(puzzleSource()?.hasCompletedDailyPuzzle).toBeTypeOf('function');
    expect(puzzleSource()?.isDailyPuzzleCompleted).toBeTypeOf('function');
  });

  it('hasPuzzleHistory 反映 history 是否非空', () => {
    const source = requireSource();
    expect(source.hasPuzzleHistory?.()).toBe(false);

    usePuzzleStore.getState().submitResult({
      sessionId: 's-1',
      mode: 'theme',
      theme: 'c-bet',
      totalQuestions: 1,
      correctCount: 1,
      wrongCount: 0,
      accuracy: 1,
      duration: 1000,
      averageTime: 1000,
      score: 100,
      timestamp: 1_700_000_000_000,
      answers: [],
      questions: [],
      status: 'completed',
    });
    expect(requireSource().hasPuzzleHistory?.()).toBe(true);
  });

  it('hasCompletedDailyPuzzle 反映 dailyCompleted 是否有任何日期', () => {
    const source = requireSource();
    expect(source.hasCompletedDailyPuzzle?.()).toBe(false);

    usePuzzleStore.getState().markDailyCompleted('2026-08-22');
    expect(requireSource().hasCompletedDailyPuzzle?.()).toBe(true);
  });

  it('isDailyPuzzleCompleted 按 dateKey 精确判定', () => {
    usePuzzleStore.getState().markDailyCompleted('2026-08-22');
    const source = requireSource();
    expect(source.isDailyPuzzleCompleted?.('2026-08-22')).toBe(true);
    expect(source.isDailyPuzzleCompleted?.('2026-08-23')).toBe(false);
  });

  it('非 puzzle 语义接口返回中性值（progress 遍历时安全）', () => {
    const source = requireSource();
    expect(source.isLevelLessonsCompleted(1)).toBe(false);
    expect(source.getCertifications()).toEqual({});
    expect(source.areAllLevelsCertified()).toBe(false);
    expect(source.isTrackCompleted('any-track')).toBe(false);
  });
});

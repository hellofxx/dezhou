import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { getAchievementSources } from '@/shared/stores/achievementRegistry';
import { getTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { AchievementDataSource } from '@/shared/types/achievementDataSource';
import type { TheoryProgress } from './types';
import { findLevelSummaryById, getCoreChaptersOfLevel, getSupplementalChaptersOfLevel } from './utils/theoryMeta';
import { chapterTitleKey } from './utils/titleKeys';

/**
 * theory-academy 启动引导（store.bootstrap）契约（单元层，Node）。
 *
 * 依赖倒置后的数据源注册：progress store 的成就检查通过 achievementRegistry 查询，
 * 每日计划 / 下一章 CTA 通过 theoryDataSourceRegistry 查询；本模块 bootstrap 负责注入 theory 读数。锁定的契约：
 * - 幂等注册：重复 import 不累积重复数据源
 * - theory 专用读数跟随 store 实时状态（完成章节 / 前 N 级全完成）
 * - academy 专用方法返回安全缺省值（theory 不实现这些维度）
 * - 增补章完成不计入「Level 全完成」判定
 * - 理论数据源：下一章元数据来自目录摘要、以调用方完成列表为准、subscribe 转发 store 变化
 */

type TheoryStoreModule = typeof import('./store');

let useTheoryStore: TheoryStoreModule['useTheoryStore'];
let pristine: TheoryProgress;

/** 注册表中的 theory 数据源（按 theory 专用可选方法识别，并断言唯一） */
function theorySource(): AchievementDataSource {
  const sources = getAchievementSources().filter(
    (source) => typeof source.getCompletedChapters === 'function',
  );
  expect(sources, 'theory 数据源应恰好注册一次').toHaveLength(1);
  return sources[0]!;
}

function coreOf(levelId: string) {
  const level = findLevelSummaryById(levelId);
  if (!level) throw new Error(`目录缺少 Level ${levelId}`);
  const core = getCoreChaptersOfLevel(level);
  if (core.length === 0) throw new Error(`Level ${levelId} 没有核心章`);
  return core;
}

function completeAll(chapterIds: string[]) {
  for (const chapterId of chapterIds) {
    useTheoryStore.getState().recordChapterAttempt(chapterId, 100, 3, 3);
  }
}

beforeAll(async () => {
  // persist 默认 storage 指向 localStorage，Node 环境需内存桩
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });

  const storeModule = await import('./store');
  useTheoryStore = storeModule.useTheoryStore;
  pristine = structuredClone(useTheoryStore.getState().progress);

  // 入口副作用：注册成就检查数据源 + 理论数据源（重复 import 走 ESM 缓存，断言不重复注册）
  await import('./store.bootstrap');
  await import('./store.bootstrap');
});

beforeEach(() => {
  useTheoryStore.setState({ progress: structuredClone(pristine) });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('store.bootstrap 成就数据源注册', () => {
  it('重复导入只注册一个 theory 数据源，且暴露 theory 专用读数', () => {
    const source = theorySource();
    expect(typeof source.getCompletedChapters).toBe('function');
    expect(typeof source.isTheoryLevelFullyCompleted).toBe('function');
  });

  it('academy 专用维度返回安全缺省值（theory 不实现）', () => {
    const source = theorySource();
    expect(source.isLevelLessonsCompleted(1)).toBe(false);
    expect(source.getCertifications()).toEqual({});
    expect(source.areAllLevelsCertified()).toBe(false);
    expect(source.isTrackCompleted('track-theory-bridge')).toBe(false);
  });

  it('getCompletedChapters 跟随 store 实时状态', () => {
    const source = theorySource();
    expect(source.getCompletedChapters!()).toEqual([]);

    const chapterId = coreOf('t1')[0]!.id;
    completeAll([chapterId]);

    expect(source.getCompletedChapters!()).toEqual([chapterId]);
  });

  it('isTheoryLevelFullyCompleted(1) 只认 T1 核心章，增补章不影响判定', () => {
    const source = theorySource();
    expect(source.isTheoryLevelFullyCompleted!(1)).toBe(false);

    const level = findLevelSummaryById('t1')!;
    const supplemental = getSupplementalChaptersOfLevel(level);
    completeAll(supplemental.map((chapter) => chapter.id));
    expect(source.isTheoryLevelFullyCompleted!(1)).toBe(false);

    completeAll(coreOf('t1').map((chapter) => chapter.id));
    expect(source.isTheoryLevelFullyCompleted!(1)).toBe(true);
  });

  it('isTheoryLevelFullyCompleted(N) 要求前 N 级全部核心章完成', () => {
    const source = theorySource();
    completeAll(coreOf('t1').map((chapter) => chapter.id));
    completeAll(coreOf('t2').map((chapter) => chapter.id));

    expect(source.isTheoryLevelFullyCompleted!(2)).toBe(true);
    expect(source.isTheoryLevelFullyCompleted!(3)).toBe(false);
  });
});

describe('store.bootstrap 理论数据源注册', () => {
  it('findNextChapter 返回目录摘要元数据（路由 / 标题 key / 预计时长）', () => {
    const source = getTheoryDataSource();
    expect(source, '理论数据源应在 bootstrap 时注册').toBeDefined();

    const firstCore = coreOf('t1')[0]!;
    const next = source!.findNextChapter([]);

    expect(next).toMatchObject({
      chapterId: firstCore.id,
      levelId: 't1',
      titleKey: chapterTitleKey(firstCore.id),
      route: `/theory/chapter/${firstCore.id}`,
    });
    expect(next!.estimatedMinutes).toBeGreaterThan(0);
  });

  it('findNextChapter 合并传入的完成列表（progress 侧快照滞后也能算对）', () => {
    const next = getTheoryDataSource()!.findNextChapter(coreOf('t1').map((chapter) => chapter.id));

    expect(next?.chapterId).toBe(coreOf('t2')[0]!.id);
    expect(next?.levelId).toBe('t2');
  });

  it('findNextChapter 不被非理论 id 覆盖理论进度（每日计划传的是策略课时 id）', () => {
    completeAll(coreOf('t1').map((chapter) => chapter.id));

    const next = getTheoryDataSource()!.findNextChapter(['l1-basics', 'l2-bb-defense']);

    expect(next?.chapterId).toBe(coreOf('t2')[0]!.id);
    expect(next?.levelId).toBe('t2');
  });

  it('getRecommendedChapter 回退为当前进度的下一章', () => {
    const recommended = getTheoryDataSource()!.getRecommendedChapter!();
    expect(recommended?.chapterId).toBe(coreOf('t1')[0]!.id);
  });

  it('subscribe 转发 theory store 变化，取消订阅后不再回调', () => {
    const listener = vi.fn();
    const unsubscribe = getTheoryDataSource()!.subscribe!(listener);

    useTheoryStore.getState().recordChapterAttempt(coreOf('t1')[0]!.id, 80, 3, 2);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    useTheoryStore.getState().recordChapterAttempt(coreOf('t1')[1]!.id, 80, 3, 2);
    expect(listener).not.toHaveBeenCalled();
  });
});

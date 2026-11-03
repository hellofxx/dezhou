/**
 * puzzle-trainer store 单元测试（独立 persist store，不触碰 progress store 的 elo）。
 *
 * 契约：
 *  - submitResult 按模式更新最佳记录（rush 比分数 / daily 比正确率，平手比更快用时 / theme 按主题分组）；
 *  - history 最新在前且上限 50 条；
 *  - markDailyCompleted 幂等（同一 dateKey 重复调用不重复标记，状态引用不变）；
 *  - getBestRecord 四分支口径与 store 字段一致；
 *  - 未破纪录时返回既有记录（previousBest）供 UI 展示。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { PuzzleResult } from './types';

// zustand persist 默认 storage 引用 window.localStorage，需在 import store 前 stub
const storageStub = createLocalStorageStub();
vi.stubGlobal('localStorage', storageStub);
vi.stubGlobal('window', { localStorage: storageStub });

const { usePuzzleStore, getBestRecord } = await import('./store');

function makeResult(overrides: Partial<PuzzleResult> = {}): PuzzleResult {
  return {
    sessionId: 'session-1',
    mode: 'daily',
    totalQuestions: 8,
    correctCount: 6,
    wrongCount: 2,
    accuracy: 0.75,
    duration: 45000,
    averageTime: 5600,
    score: 600,
    timestamp: 1_700_000_000_000,
    answers: [],
    questions: [],
    status: 'completed',
    ...overrides,
  };
}

const submit = (overrides: Partial<PuzzleResult>) =>
  usePuzzleStore.getState().submitResult(makeResult(overrides));

describe('puzzle-trainer store 初始状态', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('reset 后所有记录为空', () => {
    const state = usePuzzleStore.getState();
    expect(state.rushBest).toBeNull();
    expect(state.dailyBest).toBeNull();
    expect(state.themeBest).toEqual({});
    expect(state.dailyCompleted).toEqual({});
    expect(state.history).toEqual([]);
  });
});

describe('submitResult · Puzzle Rush 比较分数', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('首次提交即破纪录，previousBest 为 null', () => {
    const res = submit({ mode: 'rush', score: 1200, accuracy: 0.5 });
    expect(res.isNewRecord).toBe(true);
    expect(res.previousBest).toBeNull();
    expect(usePuzzleStore.getState().rushBest).toMatchObject({
      mode: 'rush',
      bestScore: 1200,
      bestAccuracy: 0.5,
    });
  });

  it('更低分数不破纪录，并返回既有记录', () => {
    submit({ mode: 'rush', score: 1200 });
    const res = submit({ mode: 'rush', score: 800 });
    expect(res.isNewRecord).toBe(false);
    expect(res.previousBest?.bestScore).toBe(1200);
    expect(usePuzzleStore.getState().rushBest?.bestScore).toBe(1200);
  });

  it('同分不算破纪录（严格大于）', () => {
    submit({ mode: 'rush', score: 1200 });
    const res = submit({ mode: 'rush', score: 1200 });
    expect(res.isNewRecord).toBe(false);
  });

  it('rush 只看分数，不看正确率（正确率高但分数低不破纪录）', () => {
    submit({ mode: 'rush', score: 1200, accuracy: 0.3 });
    const res = submit({ mode: 'rush', score: 1300, accuracy: 0.2 });
    expect(res.isNewRecord).toBe(true);
    expect(usePuzzleStore.getState().rushBest?.bestAccuracy).toBe(0.2);
  });
});

describe('submitResult · Daily 比较正确率与用时', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('更高正确率破纪录', () => {
    submit({ mode: 'daily', accuracy: 0.75, duration: 40000 });
    const res = submit({ mode: 'daily', accuracy: 0.875, duration: 60000 });
    expect(res.isNewRecord).toBe(true);
    expect(usePuzzleStore.getState().dailyBest?.bestAccuracy).toBe(0.875);
  });

  it('更低正确率不破纪录', () => {
    submit({ mode: 'daily', accuracy: 0.875 });
    const res = submit({ mode: 'daily', accuracy: 0.5, duration: 1 });
    expect(res.isNewRecord).toBe(false);
    expect(res.previousBest?.bestAccuracy).toBe(0.875);
  });

  it('正确率相同（差值 < 0.001）时用时更短破纪录', () => {
    submit({ mode: 'daily', accuracy: 0.75, duration: 45000 });
    const res = submit({ mode: 'daily', accuracy: 0.7502, duration: 30000 });
    expect(res.isNewRecord).toBe(true);
    expect(usePuzzleStore.getState().dailyBest?.bestTime).toBe(30000);
  });

  it('正确率相同且用时相同 / 更长时不破纪录', () => {
    submit({ mode: 'daily', accuracy: 0.75, duration: 45000 });
    expect(submit({ mode: 'daily', accuracy: 0.75, duration: 45000 }).isNewRecord).toBe(false);
    expect(submit({ mode: 'daily', accuracy: 0.75, duration: 60000 }).isNewRecord).toBe(false);
  });
});

describe('submitResult · Theme 按主题分组', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('各主题记录互不覆盖', () => {
    submit({ mode: 'theme', theme: 'c-bet', accuracy: 0.6 });
    submit({ mode: 'theme', theme: 'bluff', accuracy: 0.9 });
    const state = usePuzzleStore.getState();
    expect(state.themeBest['c-bet']?.bestAccuracy).toBe(0.6);
    expect(state.themeBest.bluff?.bestAccuracy).toBe(0.9);
    expect(state.themeBest['c-bet']?.theme).toBe('c-bet');
  });

  it('同一主题仅保留更优记录', () => {
    submit({ mode: 'theme', theme: 'c-bet', accuracy: 0.9, duration: 20000 });
    const res = submit({ mode: 'theme', theme: 'c-bet', accuracy: 0.6, duration: 10000 });
    expect(res.isNewRecord).toBe(false);
    expect(usePuzzleStore.getState().themeBest['c-bet']?.bestAccuracy).toBe(0.9);
  });

  it('theme 模式缺少 theme 字段时不更新任何最佳记录，但仍入 history', () => {
    const res = submit({ mode: 'theme', accuracy: 1 });
    expect(res.isNewRecord).toBe(false);
    expect(res.previousBest).toBeNull();
    expect(usePuzzleStore.getState().themeBest).toEqual({});
    expect(usePuzzleStore.getState().history).toHaveLength(1);
  });
});

describe('submitResult · history', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('最新会话在前', () => {
    submit({ sessionId: 'old', timestamp: 1 });
    submit({ sessionId: 'new', timestamp: 2 });
    expect(usePuzzleStore.getState().history.map((h) => h.sessionId)).toEqual(['new', 'old']);
  });

  it('最多保留 50 条（超出丢弃最旧）', () => {
    for (let i = 0; i < 55; i += 1) submit({ sessionId: `s-${i}` });
    const history = usePuzzleStore.getState().history;
    expect(history).toHaveLength(50);
    expect(history[0]?.sessionId).toBe('s-54');
    expect(history[49]?.sessionId).toBe('s-5');
  });
});

describe('markDailyCompleted 幂等', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('同一 dateKey 重复调用不重复标记，状态引用不变', () => {
    const store = usePuzzleStore.getState();
    store.markDailyCompleted('2026-08-22');
    const firstMap = usePuzzleStore.getState().dailyCompleted;
    store.markDailyCompleted('2026-08-22');
    // 幂等：第二次调用未触发 set，对象引用保持不变
    expect(usePuzzleStore.getState().dailyCompleted).toBe(firstMap);
    expect(usePuzzleStore.getState().dailyCompleted).toEqual({ '2026-08-22': true });
  });

  it('不同 dateKey 各自标记（跨日不覆盖）', () => {
    const store = usePuzzleStore.getState();
    store.markDailyCompleted('2026-08-22');
    store.markDailyCompleted('2026-08-23');
    expect(usePuzzleStore.getState().dailyCompleted).toEqual({
      '2026-08-22': true,
      '2026-08-23': true,
    });
  });

  it('isDailyCompleted 精确匹配 dateKey', () => {
    const store = usePuzzleStore.getState();
    expect(store.isDailyCompleted('2026-08-22')).toBe(false);
    store.markDailyCompleted('2026-08-22');
    expect(usePuzzleStore.getState().isDailyCompleted('2026-08-22')).toBe(true);
    expect(usePuzzleStore.getState().isDailyCompleted('2026-08-23')).toBe(false);
    expect(usePuzzleStore.getState().isDailyCompleted('')).toBe(false);
  });
});

describe('getBestRecord 模式分流', () => {
  beforeEach(() => {
    usePuzzleStore.getState().reset();
  });

  it('rush / daily / theme 分别读对应字段', () => {
    submit({ mode: 'rush', score: 900 });
    submit({ mode: 'daily', accuracy: 0.7 });
    submit({ mode: 'theme', theme: 'icm', accuracy: 0.8 });
    const state = usePuzzleStore.getState();

    expect(getBestRecord(state, 'rush')?.bestScore).toBe(900);
    expect(getBestRecord(state, 'daily')?.bestAccuracy).toBe(0.7);
    expect(getBestRecord(state, 'theme', 'icm')?.bestAccuracy).toBe(0.8);
    expect(getBestRecord(state, 'theme', 'bluff')).toBeNull();
    expect(getBestRecord(state, 'theme')).toBeNull();
  });
});

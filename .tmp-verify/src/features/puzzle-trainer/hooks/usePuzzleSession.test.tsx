/**
 * usePuzzleSession 会话接线回归测试（Task 3.4 BUG-PZL-001）。
 *
 * 场景：会话完成 → 结果页"再试一次"（handleRetry）→ 新会话完成。
 * 旧实现 handleRetry 未重置 submittedRef，重试后的第二次会话结束时
 * 提交 effect 被 `!submittedRef.current` 挡住，导致：
 *  - submitResult 不执行（best/history 不更新）
 *  - recordTrainingDay 不执行（Streak 漏记）
 *  - trainingEvents.emit 不执行（progress 全局统计漏记）
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

const { recordAnswerMock, recordTrainingDayMock, emitMock } = vi.hoisted(() => ({
  recordAnswerMock: vi.fn(),
  recordTrainingDayMock: vi.fn(),
  emitMock: vi.fn(),
}));

vi.mock('@/features/progress/store', () => ({
  useProgressStore: (selector: (s: unknown) => unknown) =>
    selector({ recordAnswer: recordAnswerMock, recordTrainingDay: recordTrainingDayMock }),
}));

vi.mock('@/shared/stores/trainingEvents', () => ({
  trainingEvents: { emit: emitMock },
}));

import { usePuzzleEngine, type UsePuzzleEngineReturn } from './usePuzzleEngine';
import { usePuzzleSession } from './usePuzzleSession';
import { usePuzzleStore } from '../store';
import { getPuzzlesByTheme } from '../data/puzzleBank';

/** 测试 harness：theme 模式 1 题，驱动引擎 + 会话接线 */
let api: { engine: UsePuzzleEngineReturn; retry: () => void } | null = null;

function Harness() {
  const engine = usePuzzleEngine({ mode: 'theme', theme: 'preflop-rfi', questionCount: 1 });
  const { handleRetry } = usePuzzleSession(engine);
  api = { engine, retry: handleRetry };
  return null;
}

/** 完成一整轮会话：答对唯一一题 → next → completed */
function completeSession() {
  const engine = api?.engine;
  if (!engine) throw new Error('harness not mounted');
  const question = engine.currentQuestion;
  if (!question) throw new Error('no question');
  const correct = question.options.find((o) => o.isCorrect);
  if (!correct) throw new Error('no correct option');
  act(() => {
    engine.answer(correct.id);
  });
  act(() => {
    engine.next();
  });
}

describe('usePuzzleSession retry 后二次会话提交（BUG-PZL-001）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    usePuzzleStore.getState().reset();
    api = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('第一次完成提交一次；retry 后第二次完成也必须提交', () => {
    // 题库 theme=1 题可完整跑完
    expect(getPuzzlesByTheme('preflop-rfi').length).toBeGreaterThanOrEqual(1);

    act(() => {
      root.render(<Harness />);
    });

    // 第一次会话完成
    completeSession();
    expect(usePuzzleStore.getState().history).toHaveLength(1);
    expect(recordTrainingDayMock).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledTimes(1);

    // 再试一次 → 新会话完成
    act(() => {
      api?.retry();
    });
    expect(api?.engine.state.status).toBe('playing');

    completeSession();
    expect(usePuzzleStore.getState().history).toHaveLength(2);
    expect(recordTrainingDayMock).toHaveBeenCalledTimes(2);
    expect(emitMock).toHaveBeenCalledTimes(2);

    act(() => {
      root.unmount();
    });
  });
});

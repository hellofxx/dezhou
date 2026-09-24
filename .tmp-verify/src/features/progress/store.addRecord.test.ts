import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

/**
 * P1A-04 / P1F-03 兜底（专批 B）：addRecord 对空会话（totalQuestions <= 0）
 * 做中枢级纵深防御拒收 — 不入 records、不影响统计。
 * 模块侧（range-trainer 空会话入口 / theory 空题库 effect）已各自阻断，
 * 此处防止未来任何模块发出空会话记录污染统计。
 */

function buildRecord(id: string, totalQuestions: number, correctAnswers = 0): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
      averageTime: 5,
      timestamp: Date.now(),
      details: [],
    },
  };
}

describe('progress store addRecord 空会话拒收兜底（专批 B）', () => {
  it('totalQuestions <= 0 的记录被拒收；正常记录照常入账；重复 id 去重', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const { addRecord } = useProgressStore.getState();

    // 1) 空会话（totalQuestions = 0）拒收
    addRecord(buildRecord('empty-session', 0));
    expect(useProgressStore.getState().records).toHaveLength(0);

    // 2) 负数（防御边界）同样拒收
    addRecord(buildRecord('negative-session', -1));
    expect(useProgressStore.getState().records).toHaveLength(0);

    // 3) 正常记录不受影响
    addRecord(buildRecord('valid-session', 10, 7));
    const afterValid = useProgressStore.getState().records;
    expect(afterValid).toHaveLength(1);
    expect(afterValid[0]!.id).toBe('valid-session');

    // 4) 重复 id 去重（既有行为不回归）
    addRecord(buildRecord('valid-session', 10, 8));
    expect(useProgressStore.getState().records).toHaveLength(1);

    // 5) 空会话不影响统计口径（getStatsSummary 仅见有效记录）
    const summary = useProgressStore.getState().getStatsSummary();
    expect(summary.totalSessions).toBe(1);
    expect(summary.totalQuestions).toBe(10);

    // 等待模块底部 setTimeout 副作用执行完毕，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

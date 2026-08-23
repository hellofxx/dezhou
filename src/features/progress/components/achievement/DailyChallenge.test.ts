import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import type { TrainingRecord } from '../../types';

/**
 * BUG-PRG-002 回归：每日挑战完成判定必须对齐文案承诺
 * 「完成 {{count}} 题且正确率 > {{accuracy}}%」——按今日该模块累计答题数与
 * 加权正确率计算。修复前只要求今日存在该模块任意记录，答 1 题即虚标"已完成"。
 *
 * 注：组件模块链上引用 progress store（zustand persist 依赖 window.localStorage），
 * 故按既有 store 测试模式先 stub 再动态导入。
 */

const makeRecord = (
  id: string,
  totalQuestions: number,
  correctAnswers: number,
  createdAt: number,
  module: TrainingRecord['module'] = 'range-trainer',
): TrainingRecord => ({
  id,
  module,
  mode: 'quiz',
  createdAt,
  result: {
    sessionId: id,
    module,
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    averageTime: 5,
    timestamp: createdAt,
    details: [],
  },
});

describe('isDailyChallengeCompleted（每日挑战完成判定口径）', () => {
  const today = getTodayString();
  const todayTs = new Date(`${today}T12:00:00`).getTime();

  async function loadFn() {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    const mod = await import('./DailyChallenge');
    return mod.isDailyChallengeCompleted;
  }

  it('今日仅 1 条记录（5 题 < 15）→ 未完成（修复前虚标完成）', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const records = [makeRecord('r1', 5, 5, todayTs)];
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 15, accuracy: 70 })).toBe(false);
  });

  it('题数达标但加权正确率不达标（15 题 60%）→ 未完成', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const records = [makeRecord('r1', 15, 9, todayTs)];
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 15, accuracy: 70 })).toBe(false);
  });

  it('正确率恰等于阈值（文案为严格大于）→ 未完成', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const records = [makeRecord('r1', 10, 7, todayTs)]; // 70% == 70
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 10, accuracy: 70 })).toBe(false);
  });

  it('题数与正确率均达标 → 完成', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const records = [makeRecord('r1', 15, 12, todayTs)]; // 80% > 70%
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 15, accuracy: 70 })).toBe(true);
  });

  it('跨会话累计达标（8 + 7 = 15 题，加权 73.3% > 70%）→ 完成', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const records = [
      makeRecord('r1', 8, 6, todayTs),   // 75%
      makeRecord('r2', 7, 5, todayTs),   // 71.4%（加权 11/15 ≈ 73.3%）
    ];
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 15, accuracy: 70 })).toBe(true);
  });

  it('其他模块 / 其他日期的记录不计入', async () => {
    const isDailyChallengeCompleted = await loadFn();
    const yesterdayTs = todayTs - 24 * 60 * 60 * 1000;
    const records = [
      makeRecord('r1', 20, 20, todayTs, 'pot-odds'),     // 模块不符
      makeRecord('r2', 20, 20, yesterdayTs),             // 日期不符
    ];
    expect(isDailyChallengeCompleted(records, 'range-trainer', today, { count: 15, accuracy: 70 })).toBe(false);
  });
});

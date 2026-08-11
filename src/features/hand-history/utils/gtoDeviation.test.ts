import { describe, it, expect } from 'vitest';
import { getDeviationSummary, type DeviationResult } from './gtoDeviation';

// P1-01 修复回归：getDeviationSummary 最优数统计必须使用五级体系中的 'best'。
// 修复前用已废弃的 'optimal' 值过滤，导致 optimalCount 恒为 0、最优率永远显示 0%。
describe('getDeviationSummary（P1-01 grade=best 统计）', () => {
  function makeResult(grades: string[]): DeviationResult {
    return {
      handId: 'h1',
      analyzedAt: Date.now(),
      deviations: grades.map((grade) => ({
        street: 'flop',
        action: 'call',
        gtoAction: 'raise',
        evLoss: grade === 'best' ? 0 : 3,
        grade,
      })),
    };
  }

  it('包含 best 决策时 optimalCount > 0', () => {
    const result = makeResult(['best', 'correct', 'wrong']);
    const summary = getDeviationSummary(result);
    expect(summary.totalDecisions).toBe(3);
    expect(summary.optimalCount).toBe(1);
  });

  it('无 best 决策时 optimalCount === 0', () => {
    const result = makeResult(['correct', 'inaccuracy', 'blunder']);
    const summary = getDeviationSummary(result);
    expect(summary.optimalCount).toBe(0);
  });

  it('全部 best 时 optimalCount 等于总数', () => {
    const result = makeResult(['best', 'best', 'best']);
    const summary = getDeviationSummary(result);
    expect(summary.optimalCount).toBe(3);
  });

  it('averageEvLoss 正确计算（best 为 0）', () => {
    const result = makeResult(['best', 'correct']);
    const summary = getDeviationSummary(result);
    expect(summary.averageEvLoss).toBe(1.5);
  });
});

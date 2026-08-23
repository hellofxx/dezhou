import { describe, it, expect } from 'vitest';
import { GRADE_THRESHOLDS, calculateGrade as sourceCalculateGrade } from '@/shared/types/decisionFeedback';
import { WORKER_GRADE_THRESHOLDS, calculateGrade as workerCalculateGrade } from '../workers/gtoWorker';

// 守护 worker 内阈值拷贝与源 GRADE_THRESHOLDS 的一致性（报告 P1-5）。
// worker 因独立执行上下文无法直接 import 源，故拷贝一份；任何阈值变更必须先改
// shared/types/decisionFeedback.ts，再以本测试锁住 worker 拷贝同步。
describe('GRADE_THRESHOLDS worker 拷贝 parity', () => {
  it('worker 拷贝阈值与源 GRADE_THRESHOLDS 一致（best/correct/inaccuracy/wrong）', () => {
    expect(WORKER_GRADE_THRESHOLDS.best).toBe(GRADE_THRESHOLDS.best);
    expect(WORKER_GRADE_THRESHOLDS.correct).toBe(GRADE_THRESHOLDS.correct);
    expect(WORKER_GRADE_THRESHOLDS.inaccuracy).toBe(GRADE_THRESHOLDS.inaccuracy);
    expect(WORKER_GRADE_THRESHOLDS.wrong).toBe(GRADE_THRESHOLDS.wrong);
  });

  it('calculateGrade 行为与源 parity：NaN 按 0 处理为 best（修复前 NaN 落入比较链末端被误判 blunder）', () => {
    expect(workerCalculateGrade(NaN)).toBe(sourceCalculateGrade(NaN));
    expect(workerCalculateGrade(NaN)).toBe('best');
  });

  it('calculateGrade 边界值与源 parity（0/0.5/2/5 及区间内外）', () => {
    const samples = [0, 0.01, 0.5, 1.9, 2, 2.01, 5, 5.01, 100, -1];
    for (const v of samples) {
      expect(workerCalculateGrade(v)).toBe(sourceCalculateGrade(v));
    }
  });
});

import { describe, it, expect } from 'vitest';
import { GRADE_THRESHOLDS } from '@/shared/types/decisionFeedback';
import { WORKER_GRADE_THRESHOLDS } from '../workers/gtoWorker';

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
});

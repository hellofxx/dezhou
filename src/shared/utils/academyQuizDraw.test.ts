import { describe, expect, it } from 'vitest';
import { drawByAttempt, getAttemptSeed } from './academyQuizDraw';

const pool = Array.from({ length: 20 }, (_, index) => ({ id: `q${index}` }));

describe('drawByAttempt', () => {
  it('同 key + 同 attempt 结果稳定', () => {
    const first = drawByAttempt(pool, { key: 'l1-basics', attemptNumber: 1, size: 5 });
    const second = drawByAttempt(pool, { key: 'l1-basics', attemptNumber: 1, size: 5 });
    expect(first).toEqual(second);
  });

  it('不同 attempt 换题', () => {
    const first = drawByAttempt(pool, { key: 'l1-basics', attemptNumber: 1, size: 5 });
    const second = drawByAttempt(pool, { key: 'l1-basics', attemptNumber: 2, size: 5 });
    expect(first).not.toEqual(second);
  });

  it('题池不足时全量返回，size 下限为 1', () => {
    expect(drawByAttempt(pool.slice(0, 3), { key: 'x', attemptNumber: 1, size: 5 })).toHaveLength(3);
    expect(drawByAttempt(pool, { key: 'x', attemptNumber: 1, size: 0 })).toHaveLength(1);
  });

  it('空题池返回空数组', () => {
    expect(drawByAttempt([], { key: 'x', attemptNumber: 1, size: 5 })).toEqual([]);
  });

  it('种子键包含 key 与 attempt', () => {
    expect(getAttemptSeed('a', 1)).not.toBe(getAttemptSeed('a', 2));
    expect(getAttemptSeed('a', 1)).not.toBe(getAttemptSeed('b', 1));
  });
});

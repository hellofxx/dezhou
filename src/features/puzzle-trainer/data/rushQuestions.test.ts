import { describe, expect, it } from 'vitest';
import { getRushQuestions } from './rushQuestions';

/**
 * P1D-01 回归测试：Rush 题目序列难度递增。
 *
 * 旧实现 [...easy,...medium,...hard].slice(0,30) 在 easy 题量 ≥ 30 时
 * 输出 30 题全为难度 1；现按约各 1/3 分段配比切片，输出必须含 D2/D3。
 */
describe('getRushQuestions（P1D-01 难度递增）', () => {
  const fixedDate = new Date(2026, 6, 31); // 固定日期保证测试确定性

  it('默认返回 30 题且 id 无重复', () => {
    const qs = getRushQuestions(30, fixedDate);
    expect(qs).toHaveLength(30);
    expect(new Set(qs.map((q) => q.id)).size).toBe(30);
  });

  it('输出题目难度序列包含 D1/D2/D3 三档（各约 1/3）', () => {
    const qs = getRushQuestions(30, fixedDate);
    const byDifficulty = new Map<number, number>();
    for (const q of qs) {
      byDifficulty.set(q.difficulty, (byDifficulty.get(q.difficulty) ?? 0) + 1);
    }
    expect(byDifficulty.get(1)).toBe(10);
    expect(byDifficulty.get(2)).toBe(10);
    expect(byDifficulty.get(3)).toBe(10);
  });

  it('难度序列非降序（1→2→3 递增，不回落）', () => {
    const qs = getRushQuestions(30, fixedDate);
    for (let i = 1; i < qs.length; i++) {
      expect(
        qs[i]!.difficulty,
        `第 ${i + 1} 题难度 ${qs[i]!.difficulty} 低于前一题 ${qs[i - 1]!.difficulty}`
      ).toBeGreaterThanOrEqual(qs[i - 1]!.difficulty);
    }
  });

  it('同一天两次调用序列完全一致（日期种子确定性）', () => {
    const first = getRushQuestions(30, fixedDate);
    const second = getRushQuestions(30, fixedDate);
    expect(second.map((q) => q.id)).toEqual(first.map((q) => q.id));
  });

  it('非默认 count 也保持非降序且题数正确', () => {
    const qs = getRushQuestions(12, fixedDate);
    expect(qs).toHaveLength(12);
    for (let i = 1; i < qs.length; i++) {
      expect(qs[i]!.difficulty).toBeGreaterThanOrEqual(qs[i - 1]!.difficulty);
    }
  });
});

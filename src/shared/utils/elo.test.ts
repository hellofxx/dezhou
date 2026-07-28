import { describe, expect, it } from 'vitest';
import {
  calculateEloChange,
  getRankForScore,
  getDynamicKFactor,
  abilityToElo,
  checkRankUp,
  computeOverallElo,
  applyEloChange,
} from './elo';
import { DEFAULT_ELO } from '@/shared/types/elo';

describe('calculateEloChange', () => {
  it('题目等效分等于当前分-400 时期望 0.5，答对得 +K/2', () => {
    // difficulty=0 → 等效分 0；currentRating=400 → exponent=0 → E=0.5
    expect(calculateEloChange(400, 1, 0, 32)).toBeCloseTo(16, 10);
  });

  it('同一场景答错得 -K/2（对称）', () => {
    expect(calculateEloChange(400, 0, 0, 32)).toBeCloseTo(-16, 10);
  });

  it('难度钳制到 [0,1]：超出范围与边界结果一致', () => {
    expect(calculateEloChange(500, 1, 2)).toBe(calculateEloChange(500, 1, 1));
  });
});

describe('getRankForScore', () => {
  it('0 分为新手，500 分进入入门段位', () => {
    expect(getRankForScore(0).name).toBe('新手');
    expect(getRankForScore(500).name).toBe('入门');
  });

  it('超过 3000 钳制后仍为专家', () => {
    expect(getRankForScore(3500).name).toBe('专家');
  });
});

describe('getDynamicKFactor', () => {
  it('高分老手（>200 局且 overall>1600）优先返回 24', () => {
    expect(getDynamicKFactor(250, 1700)).toBe(24);
  });

  it('新手（<50 局）返回 48，其余返回 32', () => {
    expect(getDynamicKFactor(10, 500)).toBe(48);
    expect(getDynamicKFactor(100, 1000)).toBe(32);
  });
});

describe('abilityToElo', () => {
  it('0-100 线性映射到 300-1500', () => {
    expect(abilityToElo(0)).toBe(300);
    expect(abilityToElo(50)).toBe(900);
    expect(abilityToElo(100)).toBe(1500);
  });
});

describe('checkRankUp', () => {
  it('跨段位向上返回升级事件', () => {
    const result = checkRankUp(499, 501);
    expect(result.isUp).toBe(true);
    expect(result.newRank?.name).toBe('入门');
  });

  it('降级或段位内变化不触发升级', () => {
    expect(checkRankUp(501, 499)).toEqual({ isUp: false, newRank: null });
    expect(checkRankUp(100, 200)).toEqual({ isUp: false, newRank: null });
  });
});

describe('computeOverallElo', () => {
  it('五维平均', () => {
    expect(
      computeOverallElo({ preflop: 500, postflop: 500, math: 500, handReading: 500, mental: 500 })
    ).toBe(500);
  });
});

describe('applyEloChange', () => {
  it('更新指定维度、gamesPlayed +1 并重算 overall', () => {
    const next = applyEloChange(DEFAULT_ELO, 'math', true, 0.5);
    expect(next.gamesPlayed).toBe(1);
    expect(next.math).toBeGreaterThan(DEFAULT_ELO.math);
    expect(next.overall).toBe(
      computeOverallElo({
        preflop: next.preflop,
        postflop: next.postflop,
        math: next.math,
        handReading: next.handReading,
        mental: next.mental,
      })
    );
  });
});

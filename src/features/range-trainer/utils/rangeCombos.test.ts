import { describe, it, expect } from 'vitest';
import {
  CATEGORY_COMBOS,
  countRangeCombos,
  getTotalCombosForVariant,
  getRangeComboPercentage,
} from './rangeCombos';

describe('rangeCombos（P1A-07 修复回归：占比按组合数加权）', () => {
  it('单类组合数：对子 6 / 同花 4 / offsuit 12', () => {
    expect(CATEGORY_COMBOS.pair).toBe(6);
    expect(CATEGORY_COMBOS.suited).toBe(4);
    expect(CATEGORY_COMBOS.offsuit).toBe(12);
    expect(countRangeCombos(['AA'])).toBe(6);
    expect(countRangeCombos(['AKs'])).toBe(4);
    expect(countRangeCombos(['AKo'])).toBe(12);
  });

  it('混合范围求和：AA+AKs+AKo = 22 组合', () => {
    expect(countRangeCombos(['AA', 'AKs', 'AKo'])).toBe(22);
  });

  it('空范围 → 0', () => {
    expect(countRangeCombos([])).toBe(0);
  });

  it('总组合数：标准 1326 / 短牌 630', () => {
    expect(getTotalCombosForVariant('standard')).toBe(1326);
    expect(getTotalCombosForVariant('heads-up')).toBe(1326);
    expect(getTotalCombosForVariant('short-deck')).toBe(630);
  });

  it('占比：AA+AKs+AKo 标准 = 22/1326 ≈ 1.66%（而非旧算法 3/169 ≈ 1.78%）', () => {
    expect(getRangeComboPercentage(['AA', 'AKs', 'AKo'])).toBeCloseTo((22 / 1326) * 100, 5);
  });

  it('短牌占比：AA = 6/630 ≈ 0.95%', () => {
    expect(getRangeComboPercentage(['AA'], 'short-deck')).toBeCloseTo((6 / 630) * 100, 5);
  });

  it('全 169 手牌 = 1326 组合 → 100%', () => {
    const allHands: string[] = [];
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    for (let i = 0; i < ranks.length; i++) {
      allHands.push(`${ranks[i]}${ranks[i]}`);
      for (let j = i + 1; j < ranks.length; j++) {
        allHands.push(`${ranks[i]}${ranks[j]}s`);
        allHands.push(`${ranks[i]}${ranks[j]}o`);
      }
    }
    expect(allHands).toHaveLength(169);
    expect(countRangeCombos(allHands)).toBe(1326);
    expect(getRangeComboPercentage(allHands)).toBeCloseTo(100, 5);
  });
});

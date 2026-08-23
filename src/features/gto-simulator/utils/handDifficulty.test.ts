import { describe, it, expect } from 'vitest';
import {
  STRONG_HANDS,
  INTERMEDIATE_HANDS,
  ADVANCED_HANDS,
  handToNotation,
  notationToHand,
  selectHandForDifficulty,
} from './handDifficulty';

describe('handDifficulty 169 全覆盖守卫（P1C-08）', () => {
  const all = [...STRONG_HANDS, ...INTERMEDIATE_HANDS, ...ADVANCED_HANDS];

  it('总数为 169', () => {
    expect(all.length).toBe(169);
  });

  it('无重复', () => {
    expect(new Set(all).size).toBe(169);
  });

  it('三类互斥（交集为空）', () => {
    const strong = new Set(STRONG_HANDS);
    const inter = new Set(INTERMEDIATE_HANDS);
    for (const h of INTERMEDIATE_HANDS) expect(strong.has(h)).toBe(false);
    for (const h of ADVANCED_HANDS) {
      expect(strong.has(h)).toBe(false);
      expect(inter.has(h)).toBe(false);
    }
  });

  it('A2s 存在于 ADVANCED', () => {
    expect(ADVANCED_HANDS.includes('A2s')).toBe(true);
  });

  it('计数：STRONG 15 + INTERMEDIATE 54 + ADVANCED 100', () => {
    expect(STRONG_HANDS.length).toBe(15);
    expect(INTERMEDIATE_HANDS.length).toBe(54);
    expect(ADVANCED_HANDS.length).toBe(100);
  });
});

describe('notationToHand 反向构造', () => {
  it('AKs → 同花两张，round-trip 还原 notation', () => {
    const [c1, c2] = notationToHand('AKs')!;
    expect(c1.suit).toBe(c2.suit);
    expect(handToNotation(c1, c2)).toBe('AKs');
  });

  it('QJo → 非同花两张，round-trip 还原 notation', () => {
    const [c1, c2] = notationToHand('QJo')!;
    expect(c1.suit).not.toBe(c2.suit);
    expect(handToNotation(c1, c2)).toBe('QJo');
  });

  it('TT → 对子', () => {
    const [c1, c2] = notationToHand('TT')!;
    expect(c1.rank).toBe(c2.rank);
    expect(handToNotation(c1, c2)).toBe('TT');
  });

  it('非法 notation 返回 null', () => {
    expect(notationToHand('AK')).toBeNull(); // 非对子缺 s/o
    expect(notationToHand('TTs')).toBeNull(); // 对子带 s/o
    expect(notationToHand('XYZ')).toBeNull();
  });
});

describe('selectHandForDifficulty 100% 命中目标难度（回归：旧 50 次重试存在小概率出圈）', () => {
  it('beginner 100 次全部落在 STRONG_HANDS', () => {
    for (let i = 0; i < 100; i++) {
      const hand = selectHandForDifficulty('beginner');
      expect(STRONG_HANDS).toContain(handToNotation(hand[0], hand[1]));
    }
  });

  it('intermediate / advanced 同样命中各自池', () => {
    for (let i = 0; i < 100; i++) {
      const inter = selectHandForDifficulty('intermediate');
      expect(INTERMEDIATE_HANDS).toContain(handToNotation(inter[0], inter[1]));
      const adv = selectHandForDifficulty('advanced');
      expect(ADVANCED_HANDS).toContain(handToNotation(adv[0], adv[1]));
    }
  });

  it('short-deck 变体不产生 2-5 的手牌', () => {
    for (let i = 0; i < 100; i++) {
      const hand = selectHandForDifficulty('intermediate', 'short-deck');
      expect(hand[0].rank).toBeGreaterThanOrEqual(6);
      expect(hand[1].rank).toBeGreaterThanOrEqual(6);
    }
  });

  it('未知难度回退随机手牌', () => {
    const hand = selectHandForDifficulty('unknown');
    expect(hand).toHaveLength(2);
  });
});

import { describe, it, expect } from 'vitest';
import { STRONG_HANDS, INTERMEDIATE_HANDS, ADVANCED_HANDS } from './handDifficulty';

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

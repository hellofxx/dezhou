import { describe, expect, it } from 'vitest';
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  isDigitBearingOptionSet,
  sortByNumericValue,
} from './seededShuffle';

describe('shuffleBySeed', () => {
  const source = Array.from({ length: 20 }, (_, i) => i);

  it('同种子产生确定性结果', () => {
    expect(shuffleBySeed(source, 42)).toEqual(shuffleBySeed(source, 42));
  });

  it('不修改原数组', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleBySeed(arr, 7);
    expect(arr).toEqual(copy);
  });

  it('结果是原数组的置换（元素集合一致）', () => {
    const shuffled = shuffleBySeed(source, 123);
    expect(shuffled).toHaveLength(source.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });

  it('不同种子产生不同排列（足够长数组）', () => {
    expect(shuffleBySeed(source, 1)).not.toEqual(shuffleBySeed(source, 2));
  });

  it('空数组与单元素数组直接返回副本', () => {
    expect(shuffleBySeed([], 1)).toEqual([]);
    expect(shuffleBySeed(['a'], 1)).toEqual(['a']);
  });
});

describe('hashStringToSeed', () => {
  it('同串稳定', () => {
    expect(hashStringToSeed('puzzle-001')).toBe(hashStringToSeed('puzzle-001'));
  });

  it('不同串大概率不同', () => {
    const seeds = new Set(
      ['puzzle-001', 'puzzle-002', 'outs-8', 'outs-9', 'a', 'b', ''].map(
        hashStringToSeed,
      ),
    );
    expect(seeds.size).toBe(7);
  });

  it('返回值为 uint32（>=0 且为整数）', () => {
    for (const str of ['', 'x', '中文题目', 'puzzle-daily-20260729']) {
      const seed = hashStringToSeed(str);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('isNumericOptionSet', () => {
  it('百分比选项集 → true', () => {
    expect(isNumericOptionSet(['20%', '25%', '33%', '50%'])).toBe(true);
  });

  it('outs 数选项集（含"约"前缀与描述后缀）→ true', () => {
    expect(
      isNumericOptionSet([
        '8 个（两头顺）',
        '约 15 个（组合听牌）',
        '9 个',
        '4 个',
      ]),
    ).toBe(true);
  });

  it('陈述句选项集 → false', () => {
    expect(isNumericOptionSet(['是，跟注有利', '否，应该弃牌'])).toBe(false);
  });

  it('英文动作选项集 → false', () => {
    expect(isNumericOptionSet(['Raise', 'Fold'])).toBe(false);
  });

  it('混合选项集（存在非数字开头项）→ false', () => {
    expect(isNumericOptionSet(['20%', '不确定'])).toBe(false);
  });

  it('空数组 → false', () => {
    expect(isNumericOptionSet([])).toBe(false);
  });
});

describe('isDigitBearingOptionSet', () => {
  it('数字在开头 → true', () => {
    expect(isDigitBearingOptionSet(['20%', '25%', '33%'])).toBe(true);
  });

  it('数字在中间（i18n t() 解析后）→ true', () => {
    expect(isDigitBearingOptionSet(['20%', 'About 15 (combo draw)'])).toBe(true);
  });

  it('数字后缀型 → true', () => {
    expect(isDigitBearingOptionSet(['期限 30 天', '回扣 5%'])).toBe(true);
  });

  it('陈述句选项集（无数字）→ false', () => {
    expect(isDigitBearingOptionSet(['是，跟注', '否，弃牌'])).toBe(false);
  });

  it('空数组 → false', () => {
    expect(isDigitBearingOptionSet([])).toBe(false);
  });

  it('存在一个无数字项 → false（宽松唯一致）', () => {
    expect(isDigitBearingOptionSet(['20%', '不确定'])).toBe(false);
  });
});

describe('sortByNumericValue', () => {
  it('按首个数字升序排序', () => {
    expect(
      sortByNumericValue(['33%', '20%', '50%', '25%'], (s) => s),
    ).toEqual(['20%', '25%', '33%', '50%']);
  });

  it('忽略"约"前缀并支持描述后缀', () => {
    expect(
      sortByNumericValue(
        ['约 15 个（组合听牌）', '4 个', '9 个', '8 个（两头顺）'],
        (s) => s,
      ),
    ).toEqual(['4 个', '8 个（两头顺）', '9 个', '约 15 个（组合听牌）']);
  });

  it('支持小数', () => {
    expect(
      sortByNumericValue(['4.5 bb', '2.25 bb', '3 bb'], (s) => s),
    ).toEqual(['2.25 bb', '3 bb', '4.5 bb']);
  });

  it('数值相同保持原相对顺序（稳定）', () => {
    const items = [
      { id: 'a', text: '10%' },
      { id: 'b', text: '5%' },
      { id: 'c', text: '10%' },
    ];
    const sorted = sortByNumericValue(items, (item) => item.text);
    expect(sorted.map((item) => item.id)).toEqual(['b', 'a', 'c']);
  });

  it('不修改原数组', () => {
    const arr = ['9 个', '4 个'];
    const copy = [...arr];
    sortByNumericValue(arr, (s) => s);
    expect(arr).toEqual(copy);
  });
});

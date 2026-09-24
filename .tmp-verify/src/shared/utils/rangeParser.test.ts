import { describe, expect, it } from 'vitest';
import { parseRange, getHandGridPosition, getHandFromGrid } from './rangeParser';

describe('parseRange 非法令牌清洗', () => {
  it('裸非法 tok（ABCD / 22x / AJ$）被跳过，只保留合法手牌', () => {
    expect(parseRange('AA, ABCD, 22x, AKs, AJ$')).toEqual(['AA', 'AKs']);
  });

  it('任务示例：AA, ABCD, 22x 只产出 AA 与有效组合', () => {
    expect(parseRange('AA, ABCD, 22x')).toEqual(['AA']);
  });

  it('非法对子（ZZ）被跳过', () => {
    expect(parseRange('AA, ZZ')).toEqual(['AA']);
  });

  it('"+ "后缀对子中非法 rank 跳过对应生成', () => {
    // "ZZ+" rank 不合法被跳过，仅 22+ 生成 22..AA
    expect(parseRange('ZZ+, 22+')).toEqual(
      Array.from({ length: 13 }, (_, i) => `${GRID_RANKS_CONS[i]}${GRID_RANKS_CONS[i]}`),
    );
  });

  it('"+ "后缀同花/非同花中非法 rank 跳过对应生成', () => {
    // "ZQs+" 的 Z 不合法被跳过，仅 AJs+ 生成 + KQs 精确手牌
    expect(parseRange('ZQs+, AJs+, KQs')).toEqual(['AJs', 'AQs', 'AKs', 'KQs']);
  });
});

// 供测试用：GRID_RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2']
const GRID_RANKS_CONS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

describe('parseRange 合法输入不回归', () => {
  it('精确对子直接返回', () => {
    expect(parseRange('TT')).toEqual(['TT']);
  });

  it('裸两手牌展开为同花+非同花', () => {
    expect(parseRange('QJ')).toEqual(['QJs', 'QJo']);
  });

  it('精确同花/非同花原样返回', () => {
    expect(parseRange('AKs, JTo')).toEqual(['AKs', 'JTo']);
  });

  it('混合完整范围', () => {
    expect(parseRange('22+, AJs+, KQs, QJ')).toEqual([
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AJs', 'AQs', 'AKs',
      'KQs',
      'QJs', 'QJo',
    ]);
  });

  it('空串与纯空白返回空数组', () => {
    expect(parseRange('')).toEqual([]);
    expect(parseRange('   ')).toEqual([]);
  });
});

describe('getHandGridPosition 非法输入防御', () => {
  it('非对子且 rank 不在 GRID_RANKS 的输入返回 -1 哨兵', () => {
    expect(getHandGridPosition('ABCD')).toEqual({ row: -1, col: -1 });
    expect(getHandGridPosition('QZ')).toEqual({ row: -1, col: -1 });
    expect(getHandGridPosition('ABC')).toEqual({ row: -1, col: -1 });
  });

  it('非法对子返回 -1 哨兵', () => {
    expect(getHandGridPosition('ZZ')).toEqual({ row: -1, col: -1 });
  });

  it('合法输入不回归（对子 / 同花 / 非同花）', () => {
    expect(getHandGridPosition('AA')).toEqual({ row: 0, col: 0 });
    expect(getHandGridPosition('AKs')).toEqual({ row: 0, col: 1 });
    expect(getHandGridPosition('KQo')).toEqual({ row: 2, col: 1 });
  });

  it('与 getHandFromGrid 往返一致', () => {
    for (const hand of ['AA', 'AKs', 'QJo', 'TT']) {
      const { row, col } = getHandGridPosition(hand);
      expect(row).toBeGreaterThanOrEqual(0);
      expect(col).toBeGreaterThanOrEqual(0);
      expect(getHandFromGrid(row, col)).toBe(hand);
    }
  });
});
import { describe, expect, it } from 'vitest';
import { Position, getPositionsForPlayerCount, getActionOrder } from './position';

describe('getPositionsForPlayerCount', () => {
  it('人数与位置数一致（防 5-max 空数组回归）', () => {
    for (const count of [2, 3, 4, 5, 6, 9]) {
      const positions = getPositionsForPlayerCount(count);
      expect(positions.length, `${count}-max 应返回 ${count} 个位置`).toBe(count);
    }
  });

  it('9-Max 返回含 UTG2 的 9 位位置集（Full Ring 补全）', () => {
    expect(getPositionsForPlayerCount(9)).toEqual([
      Position.UTG,
      Position.UTG1,
      Position.UTG2,
      Position.MP,
      Position.HJ,
      Position.CO,
      Position.BTN,
      Position.SB,
      Position.BB,
    ]);
  });

  it('5-Max 返回 6-Max 去 UTG 的位置集（HJ 为最早行动位）', () => {
    expect(getPositionsForPlayerCount(5)).toEqual([
      Position.HJ,
      Position.CO,
      Position.BTN,
      Position.SB,
      Position.BB,
    ]);
  });

  it('每个位置唯一', () => {
    for (const count of [2, 3, 4, 5, 6, 9]) {
      const positions = getPositionsForPlayerCount(count);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it('非法人数返回空数组', () => {
    expect(getPositionsForPlayerCount(7)).toEqual([]);
    expect(getPositionsForPlayerCount(0)).toEqual([]);
  });
});

describe('getActionOrder', () => {
  it('5-Max 翻前从 HJ 开始，盲注最后', () => {
    expect(getActionOrder(5, 'preflop')).toEqual([
      Position.HJ,
      Position.CO,
      Position.BTN,
      Position.SB,
      Position.BB,
    ]);
  });

  it('5-Max 翻后从 SB 开始，BTN 最后', () => {
    expect(getActionOrder(5, 'postflop')).toEqual([
      Position.SB,
      Position.BB,
      Position.HJ,
      Position.CO,
      Position.BTN,
    ]);
  });

  it('6-Max 翻前/翻后顺序保持不变', () => {
    expect(getActionOrder(6, 'preflop')).toEqual([
      Position.UTG,
      Position.HJ,
      Position.CO,
      Position.BTN,
      Position.SB,
      Position.BB,
    ]);
    expect(getActionOrder(6, 'postflop')).toEqual([
      Position.SB,
      Position.BB,
      Position.UTG,
      Position.HJ,
      Position.CO,
      Position.BTN,
    ]);
  });
});

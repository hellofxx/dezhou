/**
 * constants 纯函数回归：
 * - XMOD-009：低人数桌（≤2-max，HU/2-max 独立路径）绕过位置渐进解锁，直接可训
 * - XMOD-001/006：9-max 回落 6-max preset，UTG1/UTG2/MP 无 preset 判定
 */
import { describe, it, expect } from 'vitest';
import { Position } from '@/shared/types/position';
import { isPositionUnlocked, hasPresetForPosition } from './constants';

describe('isPositionUnlocked（XMOD-009 低人数解锁绕过）', () => {
  it('playerCount ≤ 2（HU/2-max）下所有位置均解锁（即使 preflop ELO 为 0）', () => {
    const allPositions = Object.values(Position);
    for (const pos of allPositions) {
      expect(isPositionUnlocked(pos, 0, 2)).toBe(true);
      expect(isPositionUnlocked(pos, 0, 1)).toBe(true);
    }
  });

  it('未传 playerCount（现有调用方兼容）仍按阈值判定，未降级', () => {
    expect(isPositionUnlocked(Position.UTG, 0)).toBe(true);
    expect(isPositionUnlocked(Position.HJ, 0)).toBe(false);
    expect(isPositionUnlocked(Position.HJ, 800)).toBe(true);
    expect(isPositionUnlocked(Position.MP, 0)).toBe(true); // 未配置阈值默认解锁
  });

  it('playerCount > 2 时仍按 ELO 阈值解锁（绕过仅限低人数）', () => {
    expect(isPositionUnlocked(Position.BTN, 0, 6)).toBe(false);
    expect(isPositionUnlocked(Position.BTN, 1200, 6)).toBe(true);
    expect(isPositionUnlocked(Position.BB, 1800, 9)).toBe(true);
  });
});

describe('hasPresetForPosition（XMOD-001/006 9-max preset 缺口）', () => {
  it('standard 9-max：UTG1/UTG2/MP 无 preset（回落 6-max preset），其余六位有', () => {
    expect(hasPresetForPosition('standard', 9, Position.UTG1)).toBe(false);
    expect(hasPresetForPosition('standard', 9, Position.UTG2)).toBe(false);
    expect(hasPresetForPosition('standard', 9, Position.MP)).toBe(false);
    expect(hasPresetForPosition('standard', 9, Position.UTG)).toBe(true);
    expect(hasPresetForPosition('standard', 9, Position.HJ)).toBe(true);
    expect(hasPresetForPosition('standard', 9, Position.CO)).toBe(true);
    expect(hasPresetForPosition('standard', 9, Position.BTN)).toBe(true);
    expect(hasPresetForPosition('standard', 9, Position.SB)).toBe(true);
    expect(hasPresetForPosition('standard', 9, Position.BB)).toBe(true);
  });

  it('standard 4-max 走 4-max 专属 preset（CO/BTN/SB 有）', () => {
    expect(hasPresetForPosition('standard', 4, Position.CO)).toBe(true);
    expect(hasPresetForPosition('standard', 4, Position.BTN)).toBe(true);
    expect(hasPresetForPosition('standard', 4, Position.SB)).toBe(true);
    expect(hasPresetForPosition('standard', 4, Position.UTG)).toBe(false);
  });
});
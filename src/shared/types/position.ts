// 牌桌位置
export enum Position {
  UTG = 'UTG',   // Under the Gun
  UTG1 = 'UTG1', // UTG+1 (6-max中为MP)
  MP = 'MP',     // Middle Position
  HJ = 'HJ',     // Hijack (LJ in some formats)
  CO = 'CO',     // Cutoff
  BTN = 'BTN',   // Button/Dealer
  SB = 'SB',     // Small Blind
  BB = 'BB',     // Big Blind
}

// 位置分组（用于范围训练简化）
export type PositionGroup = 'early' | 'middle' | 'late' | 'blinds';

// 根据人数获取有效位置
export function getPositionsForPlayerCount(count: number): Position[] {
  switch (count) {
    case 2: // Heads-Up
      return [Position.BTN, Position.BB]; // BTN=SB
    case 3: // 3-Max
      return [Position.BTN, Position.SB, Position.BB];
    case 4: // 4-Max
      return [Position.BTN, Position.CO, Position.SB, Position.BB];
    case 5: // 5-Max（6-Max 去掉 UTG：HJ 为最早行动位）
      return [Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB];
    case 6: // 6-Max
      return [Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB];
    case 9: // Full Ring
      return [Position.UTG, Position.UTG1, Position.MP, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB];
    default:
      return [];
  }
}

// 获取行动顺序
export function getActionOrder(playerCount: number, street: 'preflop' | 'postflop'): Position[] {
  const positions = getPositionsForPlayerCount(playerCount);
  if (positions.length === 0) return [];

  // HU: 翻前 BTN(SB) 先行动，翻后 BB 先行动
  if (playerCount === 2) {
    return street === 'preflop'
      ? [Position.BTN, Position.BB]
      : [Position.BB, Position.BTN];
  }

  if (street === 'preflop') {
    // 翻前：UTG 开始，按位置顺序，SB、BB 最后
    const order = positions.filter(p => p !== Position.SB && p !== Position.BB);
    return [...order, Position.SB, Position.BB];
  } else {
    // 翻后：SB 开始，按位置顺序，BTN 最后
    const order = positions.filter(p => p !== Position.SB && p !== Position.BB && p !== Position.BTN);
    return [Position.SB, Position.BB, ...order, Position.BTN];
  }
}

// 获取位置分组
export function getPositionGroup(position: Position): PositionGroup {
  switch (position) {
    case Position.UTG:
    case Position.UTG1:
      return 'early';
    case Position.MP:
    case Position.HJ:
      return 'middle';
    case Position.CO:
    case Position.BTN:
      return 'late';
    case Position.SB:
    case Position.BB:
      return 'blinds';
  }
}

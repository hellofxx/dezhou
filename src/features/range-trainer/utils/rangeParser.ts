import type { HandNotation } from '@/shared/types/poker';
import { GRID_RANKS } from '../constants';

function rankIndexOf(char: string): number {
  return (GRID_RANKS as readonly string[]).indexOf(char);
}

/**
 * 获取手牌在 13×13 矩阵中的行列索引
 * 对角线=对子，上三角=同花，下三角=非同花
 */
export function getHandGridPosition(hand: HandNotation): { row: number; col: number } {
  const isPair = hand.length === 2 && hand[0] === hand[1];
  const isSuited = hand.endsWith('s');
  const isOffsuit = hand.endsWith('o');

  if (isPair) {
    const idx = rankIndexOf(hand[0]!);
    return { row: idx, col: idx };
  }

  const highChar = hand[0]!;
  const lowChar = hand[1]!;
  const highIdx = rankIndexOf(highChar);
  const lowIdx = rankIndexOf(lowChar);

  if (isSuited) {
    // 上三角: col > row, high rank = row, low rank = col
    return { row: highIdx, col: lowIdx };
  }

  if (isOffsuit) {
    // 下三角: row > col, high rank = col, low rank = row
    return { row: lowIdx, col: highIdx };
  }

  // fallback (shouldn't happen)
  return { row: highIdx, col: lowIdx };
}

/**
 * 从行列索引获取手牌表示
 */
export function getHandFromGrid(row: number, col: number): HandNotation {
  if (row === col) {
    // 对子
    return `${GRID_RANKS[row]}${GRID_RANKS[col]}`;
  }

  if (col > row) {
    // 上三角 = 同花
    return `${GRID_RANKS[row]}${GRID_RANKS[col]}s`;
  }

  // 下三角 = 非同花
  return `${GRID_RANKS[col]}${GRID_RANKS[row]}o`;
}

/**
 * 解析范围字符串为手牌数组
 * 支持格式: "22+, AJs+, KQs, QJ" (简化解析)
 */
export function parseRange(rangeString: string): HandNotation[] {
  const parts = rangeString.split(',').map(s => s.trim()).filter(Boolean);
  const result: HandNotation[] = [];

  for (const part of parts) {
    if (part.endsWith('+')) {
      const base = part.slice(0, -1);
      // 对子+ (如 "22+" → 22, 33, ..., AA)
      if (base.length === 2 && base[0] === base[1]) {
        const startIdx = rankIndexOf(base[0]!);
        for (let i = 0; i <= startIdx; i++) {
          result.push(`${GRID_RANKS[i]}${GRID_RANKS[i]}`);
        }
      }
      // 同花+ (如 "AJs+" → AJs, AQs, AKs)
      else if (base.endsWith('s') || base.endsWith('o')) {
        const suffix = base[base.length - 1];
        const high = base[0]!;
        const low = base[1]!;
        const highIdx = rankIndexOf(high);
        const lowIdx = rankIndexOf(low);
        // 从 high 的下一个到 low
        for (let i = lowIdx; i > highIdx; i--) {
          result.push(`${GRID_RANKS[highIdx]}${GRID_RANKS[i]}${suffix}`);
        }
      }
    } else {
      // 精确手牌：对子直接推入，裸两手牌（如 "KQ"）展开为同花+非同花
      const isPair = part.length === 2 && part[0] === part[1];
      if (isPair) {
        result.push(part);
      } else if (part.length === 2) {
        result.push(`${part}s`, `${part}o`);
      } else {
        result.push(part);
      }
    }
  }

  return result;
}

/**
 * 将手牌数组转为范围字符串
 */
export function rangeToString(hands: HandNotation[]): string {
  return hands.join(', ');
}

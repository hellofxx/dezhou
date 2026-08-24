import type { HandNotation } from '@/shared/types/poker';
import { GRID_RANKS } from '@/shared/constants/poker';

function rankIndexOf(char: string): number {
  return (GRID_RANKS as readonly string[]).indexOf(char);
}

/**
 * 获取手牌在 13×13 矩阵中的行列索引
 * 对角线=对子，上三角=同花，下三角=非同花
 *
 * 容忍性：非对子且在 GRID_RANKS 找不到的 rank（非法输入）返回哨兵
 * `{ row: -1, col: -1 }`，调用方须能容忍该哨兵；本函数不 throw。
 */
export function getHandGridPosition(hand: HandNotation): { row: number; col: number } {
  const isPair = hand.length === 2 && hand[0] === hand[1];
  const isSuited = hand.endsWith('s');
  const isOffsuit = hand.endsWith('o');

  if (isPair) {
    const idx = rankIndexOf(hand[0]!);
    if (idx === -1) return { row: -1, col: -1 };
    return { row: idx, col: idx };
  }

  const highChar = hand[0]!;
  const lowChar = hand[1]!;
  const highIdx = rankIndexOf(highChar);
  const lowIdx = rankIndexOf(lowChar);

  if (highIdx === -1 || lowIdx === -1) {
    return { row: -1, col: -1 };
  }

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
 *
 * 容错：对不合法令牌做清洗而非产出垃圾手牌——非对子/非同花/非同花的裸 tok 若
 * 含 GRID_RANKS 之外的字符（如 "ABCD"、"22x"、"AJ$"）直接跳过该令牌；
 * "+" 后缀解析时 rank 不在 GRID_RANKS 的同样跳过对应生成。本函数不 throw。
 */
export function parseRange(rangeString: string): HandNotation[] {
  const parts = rangeString.split(',').map(s => s.trim()).filter(Boolean);
  const result: HandNotation[] = [];

  const rankValid = (p: string): boolean =>
    rankIndexOf(p[0]!) !== -1 && rankIndexOf(p[1]!) !== -1;

  for (const part of parts) {
    if (part.endsWith('+')) {
      const base = part.slice(0, -1);
      // 对子+ (如 "22+" → 22, 33, ..., AA)
      if (base.length === 2 && base[0] === base[1]) {
        const startIdx = rankIndexOf(base[0]!);
        if (startIdx === -1) continue; // rank 不合法，跳过
        for (let i = 0; i <= startIdx; i++) {
          result.push(`${GRID_RANKS[i]}${GRID_RANKS[i]}`);
        }
      }
      // 同花/非同花+ (如 "AJs+" → AJs, AQs, AKs)
      else if (
        base.length === 3 &&
        (base.endsWith('s') || base.endsWith('o')) &&
        rankValid(base)
      ) {
        const suffix = base[base.length - 1];
        const highIdx = rankIndexOf(base[0]!);
        const lowIdx = rankIndexOf(base[1]!);
        // 从 high 的下一个到 low
        for (let i = lowIdx; i > highIdx; i--) {
          result.push(`${GRID_RANKS[highIdx]}${GRID_RANKS[i]}${suffix}`);
        }
      }
      // 其余裸 "+" 令牌为垃圾输入，跳过
    } else {
      // 精确手牌：对子直接推入，裸两手牌（如 "KQ"）展开为同花+非同花
      const isPair = part.length === 2 && part[0] === part[1];
      if (isPair) {
        if (rankIndexOf(part[0]!) === -1) continue; // 非法对子，跳过
        result.push(part);
      } else if (part.length === 2 && rankValid(part)) {
        result.push(`${part}s`, `${part}o`);
      } else if (
        part.length === 3 &&
        (part.endsWith('s') || part.endsWith('o')) &&
        rankValid(part)
      ) {
        result.push(part);
      }
      // 其余（含非法字符的裸 tok，如 "ABCD"/"22x"/"AJ$"）跳过
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

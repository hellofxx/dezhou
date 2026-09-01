import type { Card, GameVariant } from '@/shared/types/poker';
import { Suit } from '@/shared/types/poker';
import { randomHeroHand } from './boardGenerator';

/**
 * 手牌难度分类（169 手全覆盖，三类互斥无重复，P1C-08 守卫测试锁定）
 *
 * 难度标准（GTO + Sklansky 分组）：
 * - STRONG_HANDS (beginner, 15 手)：顶级牌力，新手必学，决策清晰
 * - INTERMEDIATE_HANDS (intermediate, 54 手)：中等牌力，需结合位置决策
 * - ADVANCED_HANDS (advanced, 100 手)：边缘牌力，需高级技巧（隐含赔率/位置/剥削）
 */
export const STRONG_HANDS = [
  // 顶级对子（5）+ 99
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
  // 大 Ax 同花（4）
  'AKs', 'AQs', 'AJs', 'ATs',
  // 大 Ax 非同花（3）
  'AKo', 'AQo', 'AJo',
  // 大 K 同花（2）
  'KQs', 'KJs',
];

export const INTERMEDIATE_HANDS = [
  // 中对子（6）
  '88', '77', '66', '55', '44', '33',
  // 中 Ax 同花（7）
  'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s',
  // 中 K 同花（3）
  'KTs', 'K9s', 'K8s',
  // Q/J 同花（5）
  'QJs', 'QTs', 'Q9s', 'JTs', 'J9s',
  // T/9 同花连张（4）
  'T9s', 'T8s', '98s', '97s',
  // 8/7 同花连张（4）
  '87s', '86s', '76s', '75s',
  // 6/5 同花连张（4）
  '65s', '64s', '54s', '53s',
  // 小对子（1）
  '22',
  // 中 Ax 非同花（9）
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
  // 中 K 非同花（4）
  'KQo', 'KJo', 'KTo', 'K9o',
  // Q/J 非同花（4）
  'QJo', 'QTo', 'Q9o', 'JTo',
  // T/9 非同花（3）
  'T9o', 'T8o', '98o',
];

export const ADVANCED_HANDS = [
  // 小 Ax 同花（1，P1C-08 补入原缺失的 A2s）
  'A2s',
  // 小 K 同花（6）
  'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  // 小 Q 同花（7）
  'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  // 小 J 同花（7）
  'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  // 小 T 同花（6）
  'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  // 小 9 同花（5）
  '96s', '95s', '94s', '93s', '92s',
  // 小 8 同花（4）
  '85s', '84s', '83s', '82s',
  // 小 7 同花（3）
  '74s', '73s', '72s',
  // 小 6 同花（2）
  '63s', '62s',
  // 小 5/4/3 同花（4）
  '52s', '43s', '42s', '32s',
  // 小 K 非同花（7）
  'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
  // 小 Q 非同花（7）
  'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
  // 小 J 非同花（8）
  'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
  // 小 T 非同花（6）
  'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
  // 小 9 非同花（6）
  '97o', '96o', '95o', '94o', '93o', '92o',
  // 小 8 非同花（6）
  '87o', '86o', '85o', '84o', '83o', '82o',
  // 小 7 非同花（5）
  '76o', '75o', '74o', '73o', '72o',
  // 小 6 非同花（4）
  '65o', '64o', '63o', '62o',
  // 小 5/4/3 非同花（6）
  '54o', '53o', '52o', '43o', '42o', '32o',
];

const RANK_NAMES: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};

export function handToNotation(c1: Card, c2: Card): string {
  const r1 = RANK_NAMES[c1.rank] ?? '';
  const r2 = RANK_NAMES[c2.rank] ?? '';
  const suited = c1.suit === c2.suit;
  const [high, low] = c1.rank >= c2.rank ? [r1, r2] : [r2, r1];
  if (high === low) return high + low;
  return high + low + (suited ? 's' : 'o');
}

const RANK_VALUE: Record<string, number> = {
  A: 14, K: 13, Q: 12, J: 11, T: 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

/**
 * 由 notation（如 AKs / QJo / TT）反向构造一副具体手牌。
 * 返回 null 表示 notation 非法（不匹配 169 手规范形式）。
 */
export function notationToHand(notation: string): [Card, Card] | null {
  const m = /^([AKQJT2-9])([AKQJT2-9])(s|o)?$/.exec(notation);
  if (!m) return null;
  const high = RANK_VALUE[m[1]!]!;
  const low = RANK_VALUE[m[2]!]!;
  if (high !== low && m[3] === undefined) return null; // 非对子必须带 s/o
  if (high === low && m[3] !== undefined) return null; // 对子不带 s/o
  if (m[3] === 's') {
    return [
      { suit: Suit.Spades, rank: high },
      { suit: Suit.Spades, rank: low },
    ];
  }
  return [
    { suit: Suit.Spades, rank: high },
    { suit: Suit.Hearts, rank: low },
  ];
}

/**
 * 按难度选一副手牌：从目标难度池随机选 notation 后反向构造，
 * 保证 100% 命中目标难度（旧实现为 50 次随机重试，存在小概率出圈）。
 * short-deck 变体下过滤掉含 2-5 的 notation（该牌组中不存在）。
 * BUG-GTO-012：接受可选 rng（默认 Math.random 保持现网行为）。
 */
export function selectHandForDifficulty(
  difficulty: string,
  variant: GameVariant = 'standard',
  rng: () => number = Math.random
): [Card, Card] {
  let targetHands: string[];
  switch (difficulty) {
    case 'beginner': targetHands = STRONG_HANDS; break;
    case 'intermediate': targetHands = INTERMEDIATE_HANDS; break;
    case 'advanced': targetHands = ADVANCED_HANDS; break;
    default: return randomHeroHand(variant, rng);
  }
  const pool = variant === 'short-deck'
    ? targetHands.filter((h) => RANK_VALUE[h[0]!]! >= 6 && RANK_VALUE[h[1]!]! >= 6)
    : targetHands;
  if (pool.length === 0) return randomHeroHand(variant, rng);
  const notation = pool[Math.floor(rng() * pool.length)]!;
  return notationToHand(notation) ?? randomHeroHand(variant, rng);
}

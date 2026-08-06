import type { PokerVariant } from '@/shared/types/elo';

/** 规则接口定义 */
export interface PokerVariantRules {
  deckSize: number;
  maxPlayers: number;
  handRanking: {
    flushBeatsStraight: boolean;
    aceHighStraight: string[];
    aceLowStraight: string[];
    pairBeatsAnyAceKing?: boolean;
  };
  positions: string[];
  preflopAggression: {
    sbCanRaiseFirst: boolean;
    bbFirstToActPostflop: boolean;
    sbFirstToActPostflop?: boolean;  // P2 新增：单挑 SB 翻后先行动（可选）
  };
  anteStructure?: 'sb_ante' | 'both_ante' | 'no_ante';
  blindForces?: {
    sbAmount: number;
    bbAmount: number;
  };
  [key: string]: unknown;
}

/** 标准德州规则定义 */
export const STANDARD_DECK_RULES: PokerVariantRules = {
  deckSize: 52,
  maxPlayers: 9,
  handRanking: {
    flushBeatsStraight: true,
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
  },
  positions: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,
  },
  anteStructure: 'no_ante',
};

/** 短牌规则定义 */
export const SHORT_DECK_RULES: PokerVariantRules = {
  deckSize: 36,
  maxPlayers: 6,
  handRanking: {
    flushBeatsStraight: true,  // 短牌同花>顺子
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
    pairBeatsAnyAceKing: true,  // AA>KQ 是短牌核心差异
  },
  positions: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,
  },
  anteStructure: 'no_ante',
};

/** 单挑规则定义 */
export const HEADS_UP_RULES: PokerVariantRules = {
  deckSize: 52,
  maxPlayers: 2,
  handRanking: {
    flushBeatsStraight: true,
    aceHighStraight: ['A-K-Q-J-T'],
    aceLowStraight: ['A-2-3-4-5'],
  },
  positions: ['HU_SB', 'HU_BB'],  // 特殊位置命名
  preflopAggression: {
    sbCanRaiseFirst: false,
    bbFirstToActPostflop: true,    // BB 翻前最后行动
    sbFirstToActPostflop: true,    // SB 翻后先行动（反转）
  },
  anteStructure: 'sb_ante',
  blindForces: {
    sbAmount: 0.5,
    bbAmount: 1.0,
  },
};

/** 根据变体返回对应规则 */
export function getVariantRules(variant: PokerVariant): PokerVariantRules {
  switch (variant) {
    case 'short-deck': return SHORT_DECK_RULES;
    case 'heads-up': return HEADS_UP_RULES;
    default: return STANDARD_DECK_RULES;
  }
}

/**
 * 题目判分器（变体感知）
 * 根据规则判断答案合理性
 * @param answer 用户答案
 * @param variant 游戏变体
 * @param scenario 手牌场景
 * @returns 判分结果（isCorrect, evLoss）
 */
export function evaluateAnswer(
  _answer: string,
  _variant: PokerVariant,
  _scenario: { heroHand: [string, string]; board?: string[]; street: string }
): { isCorrect: boolean; evLoss: number } {
  // TODO: 实现具体的判分逻辑，根据 rules 判断答案合理性
  // 例：短牌中"弃掉 KJo 对 22"可能被判正确（因为 AA>KQ）
  // 目前返回默认值，等待具体业务逻辑填充
  // getVariantRules(variant) 将在 Phase 2 中被调用
  
  return { isCorrect: true, evLoss: 0 };
}

/**
 * 各游戏变体的特有规则（单一事实源）。
 * 三变体（standard / short-deck / heads-up）规则集中于此，供各 level 文件引用。
 */
import type { VariantRuleInfo } from '../../../types';

/** Short Deck（短牌）：36 张牌、三条 > 顺子、同花 > 葫芦、AK 最强非对子 */
export const shortDeckRules: VariantRuleInfo = {
  deckSize: 36,
  handRanking: {
    flushBeatsStraight: true,
    aceHighStraight: ['A', 'K', 'Q', 'J', 'T'],
    aceLowStraight: ['A', '2', '3', '4', '5'],
    pairBeatsAnyAceKing: true,
  },
  preFlopHandStrength: {
    pairBeatsAnyAceKing: true,
    suitedConnectorsStrength: 'elevated',
  },
};

/** Heads-Up（单挑）：SB 强制 Ante、BB 翻前最后行动、翻后 SB 先行动 */
export const headsUpRules: VariantRuleInfo = {
  deckSize: 52,
  positionDynamics: {
    sbAnte: true,
    bbFirstActionPreflop: true,
    sbFirstActionPostflop: true,
  },
  blindStructure: {
    sbAmount: 0.5,
    bbAmount: 1,
  },
};

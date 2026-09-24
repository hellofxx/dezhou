/**
 * 各游戏变体的特有规则（单一事实源）。
 * 三变体（standard / short-deck / heads-up）规则集中于此，供各 level 文件引用。
 */
import type { VariantRuleInfo } from '../../../types';

/**
 * Short Deck（短牌 / 6+ Hold'em）：36 张牌（6-A）、三条 > 顺子、同花 > 葫芦、
 * AK 最强非对子；因 2-5 被移除，最低顺子为 A-6-7-8-9（A 当低张）。
 */
export const shortDeckRules: VariantRuleInfo = {
  deckSize: 36,
  handRanking: {
    tripsBeatsStraight: true,
    flushBeatsFullHouse: true,
    aceHighStraight: ['A', 'K', 'Q', 'J', 'T'],
    aceLowStraight: ['A', '6', '7', '8', '9'],
  },
  preFlopHandStrength: {
    pairBeatsAnyAceKing: true,
    suitedConnectorsStrength: 'elevated',
  },
};

/**
 * Heads-Up（单挑）：SB 即按钮位（button）、SB 翻前先行动；
 * 翻后 BB 先行动，SB（按钮位）最后行动并持有位置优势。
 */
export const headsUpRules: VariantRuleInfo = {
  deckSize: 52,
  positionDynamics: {
    sbAnte: true,
    sbFirstActionPreflop: true,
    bbFirstActionPostflop: true,
  },
  blindStructure: {
    sbAmount: 0.5,
    bbAmount: 1,
  },
};

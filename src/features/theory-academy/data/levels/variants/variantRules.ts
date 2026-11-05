/**
 * 各游戏变体的特有规则（单一事实源）。
 * standard / short-deck / heads-up 规则集中于此，供各 level 文件引用。
 * heads-up 规则已提升到 shared（策略学院规则卡共用），本文件保留重导出。
 */
import type { VariantRuleInfo } from '@/shared/types/variantRules';

export { headsUpRules } from '@/shared/constants/headsUpRules';

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


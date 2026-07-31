import type { HandNotation, HandCategory, GameVariant } from '@/shared/types/poker';
import { TOTAL_COMBOS, SHORT_DECK_TOTAL_COMBOS } from '@/shared/constants/poker';
import { getHandCategory } from './handClassifier';

/**
 * P1A-07 修复：范围占比必须按组合数（combos）加权计算，而非规范手牌数/169。
 * 每个规范手牌对应的具体组合数：对子 C(4,2)=6、同花 4、非同花 12。
 */
export const CATEGORY_COMBOS: Record<HandCategory, number> = {
  pair: 6,
  suited: 4,
  offsuit: 12,
};

/** 计算一组规范手牌覆盖的具体组合总数（纯函数） */
export function countRangeCombos(hands: HandNotation[]): number {
  return hands.reduce((sum, hand) => sum + CATEGORY_COMBOS[getHandCategory(hand)], 0);
}

/** 变体对应的总组合数：标准 52 张 C(52,2)=1326；短牌 36 张 C(36,2)=630 */
export function getTotalCombosForVariant(variant: GameVariant = 'standard'): number {
  return variant === 'short-deck' ? SHORT_DECK_TOTAL_COMBOS : TOTAL_COMBOS;
}

/** 范围占比（0-100，按组合数加权） */
export function getRangeComboPercentage(
  hands: HandNotation[],
  variant: GameVariant = 'standard',
): number {
  return (countRangeCombos(hands) / getTotalCombosForVariant(variant)) * 100;
}

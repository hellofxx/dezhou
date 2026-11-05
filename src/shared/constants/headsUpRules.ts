import type { VariantRuleInfo } from '../types/variantRules';

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

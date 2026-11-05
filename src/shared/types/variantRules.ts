/** 变体规则信息（理论 / 策略共用，语言中立） */
export interface VariantRuleInfo {
  deckSize?: number;                 // 36/52
  handRanking?: {
    tripsBeatsStraight?: true;      // 短牌核心：三条 > 顺子
    flushBeatsFullHouse?: true;     // 短牌核心：同花 > 葫芦
    aceHighStraight?: string[];     // A-K-Q-J-T
    aceLowStraight?: string[];      // 短牌：A-6-7-8-9（2-5 被移除，A 当低张）
    pairBeatsAnyAceKing?: true;     // 短牌核心：口袋对 > AKo
  };
  positionDynamics?: {
    sbAnte?: boolean;               // 单挑：SB 强制 Ante
    sbFirstActionPreflop?: true;    // 单挑：翻前 SB（按钮位）先行动
    bbFirstActionPostflop?: true;   // 单挑：翻后 BB 先行动（SB/按钮位最后行动）
  };
  blindStructure?: {
    sbAmount: number;
    bbAmount: number;
  };
  preFlopHandStrength?: {
    pairBeatsAnyAceKing?: true;     // 短牌核心规则
    suitedConnectorsStrength?: 'elevated';
  };
  [key: string]: unknown;
}

/** 策略课时级变体上下文（与 strategy-academy VariantContext 结构兼容） */
export interface VariantRuleContext {
  dealerButtonPosition?: string;
  anteStructure?: 'sb_ante' | 'both_ante' | 'no_ante';
  stackDepth?: number;
  [key: string]: unknown;
}

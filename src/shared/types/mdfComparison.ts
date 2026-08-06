/**
 * MDF Comparison Concept Type Definition
 * 
 * Provides structured data for comparing MDF, Required Equity, and Bluff Frequency concepts.
 * Used in MdfComparisonTable component for clear visualization of the three related but distinct concepts.
 */

export interface MdfComparisonConcept {
  conceptName: string;           // 概念名称（如"MDF"、"Required Equity"、"Bluff Frequency"）
  englishName: string;           // 英文名称
  formula: string;               // 公式（Unicode characters for mathematical symbols）
  applicationScenario: string;   // 应用场景描述
  wrongPoint: string;            // 易错点提示
  exampleValue: number;          // 示例数值（1/2 pot bet scenario）
  exampleResult: string;         // 示例计算结果
}

/**
 * Data constants for the three core concepts in pot odds and defense frequency analysis.
 * 
 * Key distinctions:
 * - MDF: Defense perspective, "how much frequency to continue"
 * - Required Equity: Call perspective, "break-even equity for a single call"
 * - Bluff Frequency: Offense perspective, "what percentage of bluffing in betting range"
 * 
 * Note: Required Equity and Bluff Frequency share the same formula structure,
 * but serve opposite purposes (defense vs offense).
 */
export const MDF_COMPARISON_DATA: MdfComparisonConcept[] = [
  {
    conceptName: "最小防御频率",
    englishName: "Minimum Defense Frequency (MDF)",
    formula: "MDF = pot ÷ (pot + bet)",
    applicationScenario: "面对下注时，作为防守方至少需要用多少频率继续（call/raise）以防止对手无限 bluff",
    wrongPoint: "不要与 Required Equity 混淆——MDF 回答'多久跟一次'，不是'这手牌跟不跟'",
    exampleValue: 0.5,  // 1/2 pot bet
    exampleResult: "MDF = 1/(1+0.5) ≈ 67%，你需要用 top 67% 的范围继续"
  },
  {
    conceptName: "跟注所需胜率",
    englishName: "Required Equity",
    formula: "Required Equity = bet ÷ (pot + 2×bet)",
    applicationScenario: "单次跟注决策的盈亏平衡点，用于判断某手牌跟注是否盈利",
    wrongPoint: "分母是 pot+2bet 而非 pot+bet，注意与 MDF 的分母区别",
    exampleValue: 0.5,
    exampleResult: "Required Equity = 0.5/(1+1) = 25%，你需要至少 25% 胜率才能保本跟注"
  },
  {
    conceptName: "河牌诈唬占比",
    englishName: "Bluff Frequency (River)",
    formula: "Bluff Freq = bet ÷ (pot + 2×bet)",
    applicationScenario: "你的下注范围中应该包含多少比例诈唬，使对手无法通过调整来剥削",
    wrongPoint: "虽然公式与 Required Equity 相同，但应用方向完全相反（进攻 vs 防守）",
    exampleValue: 0.5,
    exampleResult: "Bluff Freq = 0.5/(1+1) = 25%，你的下注范围中 25% 应为诈唬（价值:诈唬=3:1）"
  }
];

/**
 * Helper function to calculate real-time values based on user input
 */
export interface CalculationResult {
  mdf: number;
  requiredEquity: number;
  bluffFrequency: number;
}

export function calculateComparisonValues(pot: number, bet: number): CalculationResult {
  const mdf = pot / (pot + bet);
  const requiredEquity = bet / (pot + 2 * bet);
  const bluffFrequency = bet / (pot + 2 * bet); // Same formula as required equity
  
  return {
    mdf,
    requiredEquity,
    bluffFrequency
  };
}

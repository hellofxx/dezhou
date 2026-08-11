/**
 * MDF Comparison Concept Type Definition
 *
 * Provides structured data for comparing MDF, Required Equity, and Bluff Frequency concepts.
 * PLAT-06：由 shared/types/mdfComparison.ts 收敛至 strategy-academy（唯一消费方 MDFVisualizer）。
 * UI-05：conceptName/applicationScenario/wrongPoint 存 i18n key（academy.mdf.*），渲染时 t() 解析。
 */

export interface MdfComparisonConcept {
  /** i18n key（academy.mdf.conceptMdf 等），渲染时 t() 解析 */
  conceptName: string;
  /** 英文名称（展示，跟随 formula 语义） */
  englishName: string;
  /** 公式（Unicode characters for mathematical symbols） */
  formula: string;
  /** i18n key：应用场景描述 */
  applicationScenario: string;
  /** i18n key：易错点提示 */
  wrongPoint: string;
  exampleValue: number;          // 示例数值（1/2 pot bet scenario）
  exampleResult: string;         // 示例计算结果（含公式展示，双语通用）
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
    conceptName: "academy.mdf.conceptMdf",
    englishName: "Minimum Defense Frequency (MDF)",
    formula: "MDF = pot ÷ (pot + bet)",
    applicationScenario: "academy.mdf.scenarioMdf",
    wrongPoint: "academy.mdf.wrongMdf",
    exampleValue: 0.5,  // 1/2 pot bet
    exampleResult: "MDF = 1/(1+0.5) ≈ 67%，你需要用 top 67% 的范围继续",
  },
  {
    conceptName: "academy.mdf.conceptReqEquity",
    englishName: "Required Equity",
    formula: "Required Equity = bet ÷ (pot + 2×bet)",
    applicationScenario: "academy.mdf.scenarioReqEquity",
    wrongPoint: "academy.mdf.wrongReqEquity",
    exampleValue: 0.5,
    exampleResult: "Required Equity = 0.5/(1+1) = 25%，你需要至少 25% 胜率才能保本跟注",
  },
  {
    conceptName: "academy.mdf.conceptBluff",
    englishName: "Bluff Frequency (River)",
    formula: "Bluff Freq = bet ÷ (pot + 2×bet)",
    applicationScenario: "academy.mdf.scenarioBluff",
    wrongPoint: "academy.mdf.wrongBluff",
    exampleValue: 0.5,
    exampleResult: "Bluff Freq = 0.5/(1+1) = 25%，你的下注范围中 25% 应为诈唬（价值:诈唬=3:1）",
  },
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
  // PLAT-07：防御 0 除。pot/bet 为 0 时对应概念无意义，返回 0 而非 NaN（UI 显示 0%）。
  const denominator = pot + 2 * bet;
  const safeMdfDenominator = pot + bet;

  const mdf = safeMdfDenominator > 0 ? pot / safeMdfDenominator : 0;
  const requiredEquity = denominator > 0 ? bet / denominator : 0;
  const bluffFrequency = denominator > 0 ? bet / denominator : 0; // Same formula as required equity

  return {
    mdf,
    requiredEquity,
    bluffFrequency,
  };
}

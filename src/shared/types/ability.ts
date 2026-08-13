/**
 * 用户能力评估（strategy-academy 与 progress 共享契约）。
 * 单一事实源：progress 的 ELO 初始映射（mapAcademyAbilityToElo）与
 * strategy-academy 的自适应难度均消费此类型。
 */
export interface AbilityAssessment {
  rangeKnowledge: number;     // 范围知识
  oddsCalculation: number;    // 赔率计算
  gtoUnderstanding: number;   // GTO理解
  positionalPlay: number;     // 位置打法
  emotionalControl: number;   // 情绪控制
  lastUpdated: number;
}

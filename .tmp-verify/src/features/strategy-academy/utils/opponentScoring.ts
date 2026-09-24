// P2-1.8: 对手画像 Drill 判分纯函数
// 计分口径："两问全对才计为答对"（第 1 问对手类型 + 第 2 问剥削策略）
// OpponentDrill 组件仅负责渲染与状态编排，判分逻辑以本文件为唯一事实源

import type { OpponentDrillQuestion } from '../data/opponentProfiles';

/** 单题判分结果 */
export interface OpponentAnswerScore {
  /** 第 1 问：对手类型是否答对 */
  typeCorrect: boolean;
  /** 第 2 问：剥削策略是否答对 */
  strategyCorrect: boolean;
  /** 两问全对才计为答对 */
  isFullyCorrect: boolean;
}

/**
 * 对手画像双问判分：未作答（null）视为答错
 */
export function scoreOpponentAnswer(
  question: OpponentDrillQuestion,
  selectedType: string | null,
  selectedStrategyIndex: number | null,
): OpponentAnswerScore {
  const typeCorrect = selectedType !== null && selectedType === question.correctType;
  const strategyCorrect =
    selectedStrategyIndex !== null && selectedStrategyIndex === question.correctStrategyIndex;
  return {
    typeCorrect,
    strategyCorrect,
    isFullyCorrect: typeCorrect && strategyCorrect,
  };
}

import type { TheoryLevelNumber } from '../types';

/**
 * 理论定位测评题库（16 题，覆盖 T1–T6 概念）。
 *
 * 结构约束：
 * - 题干 / 4 个选项 / 解析一律存 i18n key（`theory.placement.questions.<id>.*`），
 *   数据层只留 id、概念所属 Level 与**源顺序**下的正确项下标，杜绝中英双份原文漂移；
 * - `correctIndex` 是源数组下标，渲染前必经 utils/placement.ts 的 `orderPlacementOptions`
 *   重排（数值选项升序 / 文字选项 hash(id) 种子洗牌，correctIndex 同步重映射），源数据不手改顺序；
 * - 每题固定 4 个选项（`PLACEMENT_OPTION_COUNT`），题量固定 16（阈值表按绝对答对数分档）。
 *
 * 定位测评只写 `placement`（creditLevels），不写 completedChapters / ELO / SRS。
 */
export const PLACEMENT_OPTION_COUNT = 4;

export interface TheoryPlacementQuestion {
  id: string;
  /** 本题考察的概念所属 Level（T1–T6；只用于分档说明，不参与判分） */
  conceptLevel: TheoryLevelNumber;
  /** 源顺序下的正确项下标（0–3） */
  correctIndex: number;
}

export const THEORY_PLACEMENT_QUESTIONS: readonly TheoryPlacementQuestion[] = [
  // T1 概率论基础
  { id: 'pl-t1-combos', conceptLevel: 1, correctIndex: 0 },
  { id: 'pl-t1-outs', conceptLevel: 1, correctIndex: 2 },
  { id: 'pl-t1-variance', conceptLevel: 1, correctIndex: 2 },
  // T2 期望值与赔率
  { id: 'pl-t2-ev', conceptLevel: 2, correctIndex: 3 },
  { id: 'pl-t2-pot-odds', conceptLevel: 2, correctIndex: 0 },
  { id: 'pl-t2-implied', conceptLevel: 2, correctIndex: 2 },
  // T3 位置与起手牌
  { id: 'pl-t3-position', conceptLevel: 3, correctIndex: 1 },
  { id: 'pl-t3-gap', conceptLevel: 3, correctIndex: 3 },
  { id: 'pl-t3-initiative', conceptLevel: 3, correctIndex: 2 },
  // T4 范围理论
  { id: 'pl-t4-range', conceptLevel: 4, correctIndex: 0 },
  { id: 'pl-t4-blockers', conceptLevel: 4, correctIndex: 3 },
  { id: 'pl-t4-range-advantage', conceptLevel: 4, correctIndex: 1 },
  // T5 博弈论基础
  { id: 'pl-t5-mdf', conceptLevel: 5, correctIndex: 1 },
  { id: 'pl-t5-mixed', conceptLevel: 5, correctIndex: 2 },
  // T6 下注理论
  { id: 'pl-t6-bet-purpose', conceptLevel: 6, correctIndex: 0 },
  { id: 'pl-t6-spr', conceptLevel: 6, correctIndex: 3 },
];

/** 题库题量（分档阈值按 16 题的绝对答对数定义） */
export const PLACEMENT_QUESTION_COUNT = THEORY_PLACEMENT_QUESTIONS.length;

export const PLACEMENT_QUESTION_KEY_PREFIX = 'theory.placement.questions';

export function placementQuestionKey(questionId: string): string {
  return `${PLACEMENT_QUESTION_KEY_PREFIX}.${questionId}.question`;
}

export function placementOptionKey(questionId: string, optionIndex: number): string {
  return `${PLACEMENT_QUESTION_KEY_PREFIX}.${questionId}.options.${optionIndex}`;
}

export function placementExplanationKey(questionId: string): string {
  return `${PLACEMENT_QUESTION_KEY_PREFIX}.${questionId}.explanation`;
}

/** 解析单题的全部文案 key（渲染前一次性取出，避免组件内拼 key） */
export function placementQuestionTextKeys(questionId: string): {
  question: string;
  options: string[];
  explanation: string;
} {
  return {
    question: placementQuestionKey(questionId),
    options: Array.from({ length: PLACEMENT_OPTION_COUNT }, (_, i) =>
      placementOptionKey(questionId, i),
    ),
    explanation: placementExplanationKey(questionId),
  };
}

/**
 * 策略定位测评纯函数（P1）：分档 → creditLevels → 重测并集。
 *
 * 产品口径（PRD §5.16.12 / 计划 Fixed product decisions）：
 * - 16 题分档：0-4 → L1、5-8 → L2、9-11 → L3、12-14 → L4A、15-16 → L4B
 * - creditLevels = 推荐起点之前的全部 Level 条目（L1-L4B 单调前缀），L5+ 永不参与免修
 * - creditLevels 只放宽条目访问，绝不写 completedLessons；重测取并集、不降级
 *
 * 本文件不持有任何持久化状态：分档与免修范围是纯函数，写入由
 * store 的 `recordPlacement`（内部走 utils/p2State.mergePlacement）统一完成。
 */

import type { TFunction } from 'i18next';
import type { PlacementState } from '../types';
import type { PlacementQuestion, PlacementTopic } from '../data/placementQuestions';
import { mergePlacement } from './p2State';
import { orderResolvedOptions } from './quizShuffle';

/** 可免修的 Level 顺序（L1 → L4B）；与 p2State.PLACEMENT_CREDIT_LEVELS 同序 */
export const PLACEMENT_LEVELS = ['l1', 'l2', 'l3', 'l4a', 'l4b'] as const;

export type PlacementLevelId = (typeof PLACEMENT_LEVELS)[number];

/** 最高可免修条目：L5 及以上必须实际完成 */
export const PLACEMENT_MAX_CREDIT_LEVEL: PlacementLevelId = 'l4b';

/** 题库题量（分档以 16 题为基准） */
export const PLACEMENT_TOTAL_QUESTIONS = 16;

/**
 * 分档表：按「累计答对题数上限」自低到高排列（闭区间）。
 * 与 16 题题库一一对应；缺省命中最高档（越界钳制后不可能发生，仅作类型收口）。
 */
const PLACEMENT_BANDS: readonly { maxCorrect: number; levelId: PlacementLevelId }[] = [
  { maxCorrect: 4, levelId: 'l1' },
  { maxCorrect: 8, levelId: 'l2' },
  { maxCorrect: 11, levelId: 'l3' },
  { maxCorrect: 14, levelId: 'l4a' },
  { maxCorrect: PLACEMENT_TOTAL_QUESTIONS, levelId: 'l4b' },
];

/** 答对题数 → 推荐起点 Level（越界钳制到两端档位） */
export function scoreToRecommendedLevel(correct: number): PlacementLevelId {
  // 非有限值（NaN / Infinity）按 0 分处理：宁可推荐低档，也不越档免修
  const numeric = Number.isFinite(correct) ? Math.trunc(correct) : 0;
  const score = Math.max(0, Math.min(PLACEMENT_TOTAL_QUESTIONS, numeric));
  const band = PLACEMENT_BANDS.find((entry) => score <= entry.maxCorrect);
  return band?.levelId ?? PLACEMENT_MAX_CREDIT_LEVEL;
}

/** 推荐起点之前的全部 Level 条目（单调前缀；未知 id 视为无免修） */
export function creditLevelsForLevel(levelId: string): string[] {
  const index = (PLACEMENT_LEVELS as readonly string[]).indexOf(levelId);
  return index <= 0 ? [] : PLACEMENT_LEVELS.slice(0, index);
}

export interface PlacementOutcome {
  recommendedLevelId: PlacementLevelId;
  creditLevels: string[];
  correct: number;
  total: number;
}

/** 由答对题数构造一次测评结果（纯函数） */
export function buildPlacementOutcome(
  correct: number,
  total: number = PLACEMENT_TOTAL_QUESTIONS,
): PlacementOutcome {
  const recommendedLevelId = scoreToRecommendedLevel(correct);
  return {
    recommendedLevelId,
    creditLevels: creditLevelsForLevel(recommendedLevelId),
    correct,
    total,
  };
}

/**
 * 逐题统计答对题数。
 *
 * `answers` 存的是各题所选选项在**展示顺序**下的索引，因此传入的题目必须是
 * `resolvePlacementQuestion` 的解析结果（correctIndex 已重映射）；直接传数据层题目
 * 会因选项重排而错判。
 */
export function countCorrect(
  questions: readonly { correctIndex: number }[],
  answers: readonly number[],
): number {
  return questions.reduce(
    (sum, question, index) => (answers[index] === question.correctIndex ? sum + 1 : sum),
    0,
  );
}

/** 重测并集：已有结果与本次结果取更高起点（不降级），creditLevels 单调并集 */
export function mergePlacementOutcome(
  existing: PlacementState | null,
  outcome: PlacementOutcome,
  now: number = Date.now(),
): PlacementState {
  return mergePlacement(
    existing,
    {
      recommendedLevelId: outcome.recommendedLevelId,
      creditLevels: outcome.creditLevels,
      correct: outcome.correct,
      total: outcome.total,
    },
    now,
  );
}

// ===== 渲染层 i18n key（渲染层 key 覆盖，数据层中文零改动）=====

export function placementQuestionKey(questionId: string): string {
  return `academy.placement.question.${questionId}.question`;
}

export function placementOptionKey(questionId: string, optionIndex: number): string {
  return `academy.placement.question.${questionId}.options.${optionIndex}`;
}

export function placementExplanationKey(questionId: string): string {
  return `academy.placement.question.${questionId}.explanation`;
}

export function placementTopicKey(topic: PlacementTopic): string {
  return `academy.placement.page.topicName.${topic}`;
}

/** 已解析（i18n 替换完成）并重排选项的题目：判分以本对象为唯一事实源 */
export interface ResolvedPlacementQuestion {
  id: string;
  topic: PlacementTopic;
  level: 1 | 2 | 3 | 4;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/**
 * 解析并重排一道定位测评题（纯函数）。
 *
 * 顺序：先 `t()` 解析（zh/en 同 key），再走 `orderResolvedOptions` 重排 ——
 * 种子只依赖题目 id，因此选项顺序不随语言变化，`correctIndex` 同步重映射。
 */
export function resolvePlacementQuestion(
  t: TFunction,
  question: PlacementQuestion,
): ResolvedPlacementQuestion {
  const resolvedTexts = question.options.map((option, index) =>
    t(placementOptionKey(question.id, index), { defaultValue: option }),
  );
  const ordered = orderResolvedOptions(
    question.id,
    resolvedTexts,
    question.correctIndex,
    (text) => text,
  );
  return {
    id: question.id,
    topic: question.topic,
    level: question.level,
    question: t(placementQuestionKey(question.id), { defaultValue: question.question }),
    options: ordered.options,
    correctIndex: ordered.correctIndex,
    explanation: t(placementExplanationKey(question.id), { defaultValue: question.explanation }),
  };
}

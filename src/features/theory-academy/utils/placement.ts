import type { TheoryPlacementResult } from '../types';
import {
  PLACEMENT_OPTION_COUNT,
  PLACEMENT_QUESTION_COUNT,
  type TheoryPlacementQuestion,
} from '../data/placementQuestions';
import { getLevelSummariesByVariant } from './theoryMeta';
import { theoryLevelTitleKey } from './titleKeys';
import {
  hashStringToSeed,
  isNumericOptionSet,
  shuffleBySeed,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';

/**
 * 理论定位测评判定（纯函数，零 store 依赖）。
 *
 * 口径（PRD §5.27.7）：
 * - 答对数分档（16 题绝对口径）：0–5 → T1，6–10 → T2，11–13 → T4，14–16 → T6；
 * - creditLevels = 推荐起点之前的**全部** Level（标准系列顺序），写入后单调不减（store 取并集）；
 * - 0–5 分档额外给出零基础先修清单（牌型规则 / 起手牌位置 / 下注动作 + 入门向导链接）；
 * - 测评只产出 placement 结果，绝不写 completedChapters / ELO / SRS —— 免修只放宽解锁。
 */

/** 分档阈值（按答对数降序匹配，首条 minCorrect 命中即取该 Level） */
export const PLACEMENT_LEVEL_CUTOFFS: readonly { minCorrect: number; levelId: string }[] = [
  { minCorrect: 14, levelId: 't6' },
  { minCorrect: 11, levelId: 't4' },
  { minCorrect: 6, levelId: 't2' },
  { minCorrect: 0, levelId: 't1' },
];

/** 零基础分档上界（≤ 该答对数时展示先修清单） */
export const PLACEMENT_ZERO_BASED_MAX_CORRECT = 5;

/** 零基础先修清单的 i18n key 后缀（渲染端拼 theory.placement.prereq.<key>） */
export const PLACEMENT_PREREQUISITE_KEYS = ['rule', 'hand', 'position'] as const;

/** 零基础入门向导路由（策略学院；只用路由字符串，不产生模块 import） */
export const PLACEMENT_BASICS_ROUTE = '/academy/basics';

/** 推荐起点 Level id（'t1'–'t9'；分档表外的高分同样落在 t6） */
export function getRecommendedLevelId(correct: number): string {
  const safe = Math.max(0, Math.floor(correct));
  const hit = PLACEMENT_LEVEL_CUTOFFS.find((cutoff) => safe >= cutoff.minCorrect);
  return hit?.levelId ?? 't1';
}

/**
 * 免修 Level 列表 = 标准系列里排在推荐起点之前的全部 Level。
 * 推荐起点为 T1 时返回空数组（无任何免修）。
 */
export function getCreditedLevelIds(recommendedLevelId: string): string[] {
  const levels = getLevelSummariesByVariant('standard');
  const index = levels.findIndex((level) => level.id === recommendedLevelId);
  if (index <= 0) return [];
  return levels.slice(0, index).map((level) => level.id);
}

/** 是否零基础分档（决定是否展示先修清单与入门向导链接） */
export function isZeroBasedPlacement(correct: number): boolean {
  return Math.max(0, Math.floor(correct)) <= PLACEMENT_ZERO_BASED_MAX_CORRECT;
}

export interface PlacementEvaluation {
  /** 0–100 得分（四舍五入） */
  score: number;
  correct: number;
  total: number;
  recommendedLevelId: string;
  creditLevels: string[];
  zeroBased: boolean;
}

/** 判分 + 分档 + 免修列表（唯一判定入口） */
export function evaluatePlacement(correct: number, total: number): PlacementEvaluation {
  const safeTotal = Math.max(0, Math.floor(total));
  const safeCorrect = Math.min(Math.max(0, Math.floor(correct)), safeTotal);
  const recommendedLevelId = getRecommendedLevelId(safeCorrect);
  return {
    score: safeTotal === 0 ? 0 : Math.round((safeCorrect / safeTotal) * 100),
    correct: safeCorrect,
    total: safeTotal,
    recommendedLevelId,
    creditLevels: getCreditedLevelIds(recommendedLevelId),
    zeroBased: isZeroBasedPlacement(safeCorrect),
  };
}

/** 组装持久化载荷（completedAt 由调用方注入时间戳，便于测试固定时钟） */
export function createPlacementResult(
  evaluation: PlacementEvaluation,
  completedAt: number,
): TheoryPlacementResult {
  return {
    score: evaluation.score,
    correct: evaluation.correct,
    total: evaluation.total,
    recommendedLevelId: evaluation.recommendedLevelId,
    creditLevels: [...evaluation.creditLevels],
    completedAt,
  };
}

/** 推荐起点 Level 的标题 key（渲染端 t(key) 解析） */
export function placementLevelTitleKey(levelId: string): string {
  return theoryLevelTitleKey(levelId);
}

export interface OrderedPlacementOption {
  /** 展示文本（已由调用方 t() 解析） */
  text: string;
  isCorrect: boolean;
  /** 源数组下标（调试与测试用） */
  originalIndex: number;
}

/**
 * 选项渲染顺序出口（答案位置偏差治理，规则与章末小测一致）：
 * 数值选项集按数值升序，文字选项集按 hash(题 id) 种子洗牌；
 * 种子只依赖题 id，故 zh/en 展示顺序一致。源数据 correctIndex 不手改。
 */
export function orderPlacementOptions(
  questionId: string,
  options: readonly string[],
  correctIndex: number,
): OrderedPlacementOption[] {
  const indices = options.map((_, index) => index);
  const order = isNumericOptionSet([...options])
    ? sortByNumericValue(indices, (index) => options[index] ?? '')
    : shuffleBySeed(indices, hashStringToSeed(questionId));
  return order.map((originalIndex) => ({
    text: options[originalIndex] ?? '',
    isCorrect: originalIndex === correctIndex,
    originalIndex,
  }));
}

/** 题库结构自检（渲染端防御：correctIndex 越界即视为坏数据） */
export function isPlacementQuestionWellFormed(
  question: TheoryPlacementQuestion,
  optionCount = PLACEMENT_OPTION_COUNT,
): boolean {
  return question.correctIndex >= 0 && question.correctIndex < optionCount;
}

/** 测评题量（分档表按该题量的绝对答对数定义） */
export { PLACEMENT_QUESTION_COUNT, PLACEMENT_OPTION_COUNT };

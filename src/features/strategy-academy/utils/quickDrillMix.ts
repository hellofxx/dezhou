/**
 * P1E-04: 快速训练 SRS 复习题混合与回填（纯函数）。
 *
 * 背景：composeDailyMix 按比例分配复习/新题名额，但无 metadata.options 的
 * ReviewItem 无法渲染为选择题会被丢弃。若丢弃后不回填，5 题会话可能缩水
 * 为 3 题，破坏"快速 5 题 / 普通 8 题"的题数契约。
 *
 * 本模块在丢弃后按缺口数量从新题池回填补足总题数（新题池不足时尽力而为）。
 */
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { composeDailyMix } from '@/features/progress/utils/dailyTrainingMix';
import type { PracticeQuestion } from '../types';

/**
 * 将 ReviewItem 转换为 PracticeQuestion。
 *
 * 复习题通常没有完整的 scenario（手牌/位置/底池），合成一个占位场景，
 * 把题目文本放在 previousActions 中显示。仅支持带 metadata.options 的选择题，
 * 否则返回 null（由 composeQuickDrillQuestions 统一回填）。
 */
export function reviewItemToPracticeQuestion(item: ReviewItem): PracticeQuestion | null {
  if (!item.metadata?.options || item.metadata.options.length === 0) return null;
  return {
    id: `review-${item.id}`,
    scenario: {
      heroHand: ['As', 'Ks'], // 占位卡片（复习题不依赖具体场景）
      heroPosition: 'BTN',
      previousActions: [
        { player: '📚 复习', action: item.metadata.front ?? item.label },
      ],
      street: 'preflop',
      potSize: 0,
      effectiveStack: 0,
    },
    options: item.metadata.options.map((opt) => ({
      action: opt.text,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation ?? '',
    })),
    difficulty: 'beginner',
  };
}

export interface QuickDrillMixResult {
  /** 最终题目列表（复习题在前作热身，新题在后；总数不超过 questionCount） */
  questions: PracticeQuestion[];
  /** 实际混入的复习题数量（丢弃不可渲染项之后） */
  reviewCount: number;
}

/**
 * 组合快速训练题目：SRS 复习题混合 + 缺口回填。
 *
 * 1. 调用 composeDailyMix 决定复习题/新题名额（依据用户最近正确率）
 * 2. 复习项转选择题，无 options 的项被丢弃
 * 3. P1E-04: 丢弃产生的缺口按数量从新题池回填，保证总题数契约
 */
export function composeQuickDrillQuestions(
  newQuestions: PracticeQuestion[],
  todayReviewItems: ReviewItem[],
  questionCount: number,
  userAccuracy: number,
): QuickDrillMixResult {
  if (todayReviewItems.length === 0) {
    return { questions: newQuestions.slice(0, questionCount), reviewCount: 0 };
  }

  const mix = composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy);

  // 将复习项转换为 PracticeQuestion（仅保留带 options 的选择题）
  const reviewQuestions = todayReviewItems
    .slice(0, mix.reviewCount)
    .map(reviewItemToPracticeQuestion)
    .filter((q): q is PracticeQuestion => q !== null);

  // 复习题在前（作为热身），新题在后
  let combined: PracticeQuestion[] = [...reviewQuestions, ...mix.questions];

  // P1E-04: 回填 — 被丢弃的复习项产生的缺口从新题池未使用部分补足
  if (combined.length < questionCount) {
    const usedIds = new Set(combined.map((q) => q.id));
    const backfillPool = newQuestions.filter((q) => !usedIds.has(q.id));
    combined = [...combined, ...backfillPool.slice(0, questionCount - combined.length)];
  }

  return {
    questions: combined.slice(0, questionCount),
    reviewCount: reviewQuestions.length,
  };
}

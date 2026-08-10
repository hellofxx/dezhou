import { useMemo, useCallback } from 'react';
import { usePotOddsStore } from '../store';
// P1-B 修复（P1B-01/02/03）：口径计算抽为纯函数 utils/oddsMath.computeOddsResult（可直接单测）
import { computeOddsResult } from '../utils/oddsMath';
import type { OddsResult, PotOddsQuizQuestion } from '../types';
import { useProgressStore } from '@/features/progress/store';
// P1-3.2: SRS 集成
import {
  answerQuality,
  upsertReviewItem,
} from '@/features/progress/utils/spacedRepetition';
// P2-2.3: 五级反馈
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { buildDecisionFeedback } from '@/shared/types/decisionFeedback';
// 答案位置偏差治理：选项顺序统一由 orderQuizOptions 处理
import { orderQuizOptions } from '../utils/quizOrder';

/**
 * 返回最简单的赔率题：底池 100，下注 0，跟注 0，胜率 0% 即可盈利，应该跟注吗？答案=是。
 * 用于"最后一题简单"策略：让用户以正确结束训练。
 *
 * 选项顺序：与题库一致经 orderQuizOptions 确定性洗牌。因本题 id 为 0 占位
 * 且调用方会改写 id，洗牌种子使用固定字符串 'easy-odds'，与最终 id 无关。
 *
 * 注：useOddsCalculation 本身只做数值计算，不管理题目流；
 * 调用方组件（PotOddsQuizPage）使用本辅助函数实现"最后一题简单 + 补救"逻辑。
 */
export function getEasyOddsQuestion(): PotOddsQuizQuestion {
  return orderQuizOptions(
    {
      id: 0, // 调用方负责改写 id 以避免与现有题目冲突
      category: 'odds-judgment',
      scenario: '底池 100，对手过牌（下注 0），你跟注 0 即可看到下一张牌。',
      question: '此时跟注是否盈利？',
      options: [
        {
          text: '是，免费看牌永远盈利',
          isCorrect: true,
          explanation: '跟注金额为 0，所需胜率 = 0/(100+0+0) = 0%。任何手牌都满足，跟注（实际为过牌）永远是 +EV。',
        },
        {
          text: '否，应该弃牌',
          isCorrect: false,
          explanation: '跟注 0 不需要任何胜率，弃牌反而放弃了免费看牌的机会。',
        },
      ],
    },
    'easy-odds',
  );
}

export function useOddsCalculation(): OddsResult {
  const oddsState = usePotOddsStore((s) => s.oddsState);

  // 口径详见 utils/oddsMath.ts 头注（题库三项式：所需胜率 = bet / (pot + bet + bet)）
  return useMemo(() => computeOddsResult(oddsState), [oddsState]);
}

/**
 * P1-2.4: pot-odds ELO 记录器（维度=math）
 *
 * 调用方（PotOddsQuizPage）在答题后调用返回的 recordEloForAnswer 函数。
 * 难度推断：pot-odds 题目无统一 difficulty 字段，根据当前 math ELO 推断
 * （高分用户对应高难度题目，简化映射：ELO 0-3000 → 难度 0-1）
 */
export function useOddsEloRecorder() {
  const updateElo = useProgressStore((s) => s.updateElo);
  const mathElo = useProgressStore((s) => s.elo.math);

  return useCallback(
    (isCorrect: boolean, difficulty?: number) => {
      const diff =
        typeof difficulty === 'number'
          ? Math.min(1, Math.max(0, difficulty))
          : Math.min(1, Math.max(0, mathElo / 3000));
      updateElo('math', isCorrect, diff);
    },
    [updateElo, mathElo]
  );
}

/**
 * P1-3.2: pot-odds SRS 记录器
 *
 * 调用方（PotOddsQuizPage）在答题后调用返回的 recordSrsForAnswer 函数。
 * 题目 → ReviewItem 映射：使用 `odds:${question.id}` 作为 id，metadata 携带
 * 完整选项数据，复习模式可直接渲染为选择题。
 *
 * quality 评分：答对且用时<5秒→5，答对→4，答错→1
 */
export function useOddsSrsRecorder() {
  const addReviewItem = useProgressStore((s) => s.addReviewItem);
  const updateReviewItem = useProgressStore((s) => s.updateReviewItem);
  const reviewItems = useProgressStore((s) => s.reviewItems);

  return useCallback(
    (question: PotOddsQuizQuestion, isCorrect: boolean, timeTakenMs: number) => {
      const id = `odds:${question.id}`;
      const label = `${question.scenario.slice(0, 40)}${question.scenario.length > 40 ? '…' : ''}`;
      const metadata = {
        front: question.question,
        back: question.options.find((o) => o.isCorrect)?.text ?? '',
        options: question.options.map((o) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          explanation: o.explanation,
        })),
        source: 'odds' as const,
        scenario: question.scenario,
      };

      const { item: updated, isNew } = upsertReviewItem(
        reviewItems,
        id,
        label,
        'odds',
        metadata,
        answerQuality(isCorrect, timeTakenMs),
      );

      if (isNew) {
        addReviewItem(updated);
      } else {
        updateReviewItem(updated);
      }
    },
    [reviewItems, addReviewItem, updateReviewItem]
  );
}

/**
 * P2-2.3: 根据赔率题答题对错构造五级 DecisionFeedback。
 *
 * pot-odds 题目为选择题，没有 evLoss 字段，使用以下默认映射：
 *  - 答对 → 'best'（evLoss=0）
 *  - 答错 → 'wrong'（默认 evLoss=3 BB，落在 wrong 2-5 区间）
 *
 * 若调用方持有 EV 数值（如 OddsResult.ev），可传入 evLossOverride 进行更精细的分级。
 */
export function buildOddsFeedback(
  isCorrect: boolean,
  correctAction: string,
  evLossOverride?: number,
  explanation?: string,
  relatedLessonId?: string,
): DecisionFeedback {
  return buildDecisionFeedback({
    isCorrect,
    evLoss: evLossOverride,
    correctAction,
    explanation,
    relatedLessonId,
  });
}

/**
 * P2-5.2: pot-odds 情绪管理记录器
 *
 * 调用方（PotOddsQuizPage）在答题后调用返回的 recordAnswerForEmotion 函数。
 * 内部转发到 progressStore.recordAnswer，用于更新连续答错数 / 每日题量 / accuracyHistory。
 */
export function useOddsEmotionRecorder() {
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  return useCallback(
    (isCorrect: boolean) => {
      recordAnswer(isCorrect);
    },
    [recordAnswer]
  );
}

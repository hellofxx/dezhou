/**
 * PuzzleCard 五级反馈面板（P1-D 修复批从 PuzzleCard.tsx 拆出以满足单文件 ≤200 行）。
 *
 * 复用 GRADE_DISPLAY_CONFIG 统一评级展示；接入教育脚手架（DESIGN_LANGUAGE §13.4）：
 * - DecisionAnalysis 折叠区：你的决策 vs GTO 最优 + 差异原因 + 相关课程链接
 * - TryAgainButton：wrong/blunder 级别底部"再做一题"
 * - RelatedLessonChip：替换原"去复习"文本链接（relatedLessonId 由 usePuzzleEngine 推导）
 */
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionFast } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { DecisionAnalysis } from '@/shared/components/feedback/DecisionAnalysis';
import { RelatedLessonChip } from '@/shared/components/feedback/RelatedLessonChip';
import { TryAgainButton } from '@/shared/components/feedback/TryAgainButton';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import type { PuzzleAnswerRecord, PuzzleQuestion } from '../types';

/** 五级反馈面板 */
export function PuzzleCardFeedback({
  question,
  record,
  onNext,
  isLastQuestion,
}: {
  question: PuzzleQuestion;
  record: PuzzleAnswerRecord;
  onNext: () => void;
  isLastQuestion: boolean;
}) {
  const { t } = useTranslation();
  const config = GRADE_DISPLAY_CONFIG[record.grade];
  const selectedOption = question.options.find((o) => o.id === record.selectedOptionId);
  const correctOption = question.options.find((o) => o.isCorrect);
  // 错误级别（wrong/blunder）：默认展开决策分析 + 显示"再做一题"
  const isErrorGrade = record.grade === 'wrong' || record.grade === 'blunder';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={transitionFast}
      className="mt-2 rounded-md border border-[var(--walnut-border)]/60 bg-[var(--walnut)]/30 p-3 space-y-2"
    >
      {/* 评级 + 文案 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">{config.icon}</span>
        <span className={cn('font-display tracking-wide', config.textColor)}>
          {t(config.titleKey)}
        </span>
        {record.evLoss > 0 && (
          <span className="text-xs text-[var(--ivory-dim)] font-numeric">
            EV {record.evLoss.toFixed(1)} BB
          </span>
        )}
      </div>

      {/* 完整解析 */}
      <div className="pt-1 border-t border-[var(--walnut-border)]/40">
        <p className="text-[10px] uppercase tracking-wider text-[var(--brass-dark)] mb-1">
          {t('puzzle.card.fullExplanation')}
        </p>
        <p className="text-xs text-[var(--ivory)] leading-relaxed">
          {question.correctExplanation}
        </p>
      </div>

      {/* 正确答案提示（答错时） */}
      {!record.isCorrect && correctOption && (
        <p className="text-xs text-[var(--success)]">
          {t('puzzle.card.correctAnswerPrefix', { answer: correctOption.text })}
        </p>
      )}

      {/* 决策分析折叠区：你的决策 vs GTO 最优 + 差异原因 + 相关课程（wrong/blunder 默认展开） */}
      <DecisionAnalysis
        userAction={selectedOption?.text}
        gtoAction={correctOption?.text}
        difference={selectedOption?.explanation}
        relatedLessonId={record.relatedLessonId}
        defaultOpen={isErrorGrade}
      />

      {/* 底部操作区：相关课程标签（答错时）+ 再做一题（错误级别）+ 下一题 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {!record.isCorrect && record.relatedLessonId && (
          <RelatedLessonChip lessonId={record.relatedLessonId} />
        )}
        <div className="flex items-center gap-2 ml-auto">
          {isErrorGrade && <TryAgainButton onTryAgain={onNext} />}
          <Button
            onClick={onNext}
            size="sm"
            className="bg-[var(--brass)] text-[var(--primary-fg)] hover:bg-[var(--brass-bright)]"
          >
            {isLastQuestion
              ? t('puzzle.card.viewResult')
              : t('puzzle.card.nextQuestion')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * PuzzleCard 五级反馈面板（P1-D 修复批从 PuzzleCard.tsx 拆出以满足单文件 ≤200 行）。
 *
 * 复用 GRADE_DISPLAY_CONFIG 统一评级展示；wrong/blunder 等答错场景
 * 显示"去复习"课程跳转（relatedLessonId 由 usePuzzleEngine 推导）。
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import {
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
} from '@/shared/types/decisionFeedback';
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
  const config = GRADE_DISPLAY_CONFIG[record.grade as DecisionGrade];
  const selectedOption = question.options.find((o) => o.id === record.selectedOptionId);
  const correctOption = question.options.find((o) => o.isCorrect);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.25 }}
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

      {/* 选项解析 */}
      {selectedOption && (
        <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
          {selectedOption.explanation}
        </p>
      )}

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

      {/* P4 修复（4.2-P1-2）：答错时显示"去复习"课程跳转 */}
      {!record.isCorrect && record.relatedLessonId && (
        <Link
          to={`/academy/lesson/${record.relatedLessonId}`}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--brass-bright)] hover:text-[var(--brass)] transition-colors pt-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          去复习相关课程 →
        </Link>
      )}

      {/* 下一题按钮 */}
      <div className="flex justify-end pt-1">
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
    </motion.div>
  );
}

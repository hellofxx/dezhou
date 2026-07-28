/**
 * 单题卡片组件：渲染场景、手牌、选项、三级反馈。
 *
 * 复用 DecisionFeedback 类型与 GRADE_DISPLAY_CONFIG 配置样式。
 * 支持三种模式（rush / daily / theme），Rush 模式下额外显示连对数与剩余命。
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, Flame, Zap, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
} from '@/shared/types/decisionFeedback';
import type { PuzzleAnswerRecord, PuzzleQuestion } from '../types';

interface PuzzleCardProps {
  question: PuzzleQuestion;
  /** 当前题已答的记录（未答时 null） */
  answerRecord: PuzzleAnswerRecord | null;
  /** 当前选中的选项 ID（用于高亮） */
  selectedOptionId: string | null;
  /** 选择回调 */
  onSelectOption: (optionId: string) => void;
  /** 进入下一题回调（已答时显示按钮） */
  onNext: () => void;
  /** 是否是最后一题（影响按钮文案） */
  isLastQuestion?: boolean;
  /** Puzzle Rush 模式：显示连对数与剩余命 */
  rushMode?: boolean;
  lives?: number;
  streak?: number;
  /** 题目序号显示，如 "第 3 / 8 题" */
  questionProgress?: { current: number; total: number };
  /** 最近一次连对奖励（毫秒），>0 时显示"+10s" */
  bonusFeedback?: number;
}

export function PuzzleCard({
  question,
  answerRecord,
  selectedOptionId,
  onSelectOption,
  onNext,
  isLastQuestion = false,
  rushMode = false,
  lives,
  streak,
  questionProgress,
  bonusFeedback,
}: PuzzleCardProps) {
  const { t } = useTranslation();
  const isAnswered = answerRecord !== null;
  const themeLabel = t(`puzzle.themes.${question.theme}`, question.theme);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--ivory-dim)]">
          <span className="px-2 py-0.5 rounded-full bg-[var(--walnut)]/60 text-[var(--brass-bright)] font-display tracking-wide">
            {themeLabel}
          </span>
          {questionProgress && (
            <span className="font-numeric">
              {t('puzzle.card.progress', {
                current: questionProgress.current,
                total: questionProgress.total,
              })}
            </span>
          )}
        </div>
        {rushMode && (
          <div className="flex items-center gap-3">
            {/* 命数 */}
            <div className="flex items-center gap-1">
              {typeof lives === 'number' &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      'w-4 h-4',
                      i < lives
                        ? 'fill-[var(--clay)] text-[var(--clay)]'
                        : 'text-[var(--walnut-border)]'
                    )}
                  />
                ))}
            </div>
            {/* 连对数 */}
            {typeof streak === 'number' && streak > 0 && (
              <div className="flex items-center gap-1 text-[var(--brass-bright)]">
                <Flame className="w-4 h-4" />
                <span className="font-numeric">{streak}</span>
              </div>
            )}
            {/* 连对奖励反馈 */}
            {bonusFeedback && bonusFeedback > 0 ? (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brass-bright)]/20 text-[var(--brass-bright)] font-display text-xs"
              >
                <Zap className="w-3 h-3" />+{Math.floor(bonusFeedback / 1000)}s
              </motion.span>
            ) : null}
          </div>
        )}
      </div>

      {/* 场景卡片 */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <CardContent className="p-4 space-y-3">
          {/* 场景描述 */}
          <p className="text-sm text-[var(--ivory)] leading-relaxed">
            {question.scenario}
          </p>

          {/* 手牌 / 位置 / 公共牌 / 底池 */}
          <div className="flex flex-wrap gap-2 text-xs">
            {question.hand && (
              <InfoChip
                label={t('puzzle.card.handLabel')}
                value={question.hand}
                mono
              />
            )}
            {question.position && (
              <InfoChip
                label={t('puzzle.card.positionLabel')}
                value={question.position}
              />
            )}
            {question.board && (
              <InfoChip
                label={t('puzzle.card.boardLabel')}
                value={question.board}
                mono
              />
            )}
            {typeof question.potSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.potLabel')}
                value={`${question.potSize} BB`}
              />
            )}
            {typeof question.betSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.betLabel')}
                value={`${question.betSize} BB`}
              />
            )}
            {typeof question.stackSize === 'number' && (
              <InfoChip
                label={t('puzzle.card.stackLabel')}
                value={`${question.stackSize} BB`}
              />
            )}
          </div>

          {/* 选项按钮列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const showResult = isAnswered && isSelected;
              const showCorrect = isAnswered && opt.isCorrect;
              return (
                <Button
                  key={opt.id}
                  variant="outline"
                  disabled={isAnswered}
                  onClick={() => onSelectOption(opt.id)}
                  className={cn(
                    'justify-start text-sm h-auto py-2.5 px-3 border-[var(--walnut-border)]',
                    !isAnswered &&
                      'hover:border-[var(--brass-muted)] hover:bg-[var(--surface-raised)] text-[var(--ivory)]',
                    showResult &&
                      opt.isCorrect &&
                      'border-[var(--success)] bg-[var(--success)]/15 text-[var(--success)]',
                    showResult &&
                      !opt.isCorrect &&
                      'border-[var(--clay)] bg-[var(--clay)]/15 text-[var(--clay)]',
                    showCorrect && !isSelected && 'border-[var(--success)] text-[var(--success)]',
                    isAnswered && !showResult && !showCorrect && 'opacity-50 text-[var(--ivory-dim)]'
                  )}
                >
                  <span className="font-display tracking-wide">{opt.text}</span>
                  {showCorrect && <span className="ml-auto text-xs">✓</span>}
                </Button>
              );
            })}
          </div>

          {/* 反馈面板 */}
          {isAnswered && answerRecord && (
            <FeedbackPanel
              question={question}
              record={answerRecord}
              onNext={onNext}
              isLastQuestion={isLastQuestion}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** 信息标签 */
function InfoChip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--walnut)]/40 border border-[var(--walnut-border)]/40">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-dim)]">
        {label}
      </span>
      <span
        className={cn(
          'text-[var(--ivory)]',
          mono ? 'font-numeric tracking-wider' : 'font-display'
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** 三级反馈面板 */
function FeedbackPanel({
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

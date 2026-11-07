import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { CheckpointQuestion } from '../utils/checkpoint';
import { checkpointText } from '../utils/checkpointCopy';

interface CheckpointQuizViewProps {
  level: number;
  question: CheckpointQuestion;
  currentIndex: number;
  total: number;
  selectedIndex: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
}

/**
 * 检查点作答卡（12 题混合测评的单题视图）。
 * 与课后测验/认证同一条渲染管线：抽题 → t() 解析 → 选项重排后的题对象直接渲染。
 */
export function CheckpointQuizView({
  level,
  question,
  currentIndex,
  total,
  selectedIndex,
  answered,
  onSelect,
  onNext,
}: CheckpointQuizViewProps) {
  const { t } = useTranslation();
  const item = question.question;
  const isCorrect = selectedIndex === item.correctIndex;
  const isLast = currentIndex >= total - 1;

  return (
    <div className="py-6">
      <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-base text-[var(--ivory)]">
            {checkpointText(t, 'title', 'Level {{level}} 检查点', { level })}
          </h2>
          <p className="text-xs font-numeric text-[var(--ivory-muted)]">
            {checkpointText(t, 'questionOf', '第 {{current}} / {{total}} 题', {
              current: currentIndex + 1,
              total,
            })}
          </p>
        </div>

        <div className="flex items-center gap-1.5 mb-5" aria-hidden="true">
          {Array.from({ length: total }, (_unused, index) => (
            <div
              key={index}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                index < currentIndex
                  ? 'bg-[var(--brass-bright)]'
                  : index === currentIndex
                    ? 'bg-[var(--brass)]'
                    : 'bg-[var(--walnut-raised)]',
              )}
            />
          ))}
        </div>

        <h3 className="font-display text-[17px] text-[var(--ivory)] mb-5 leading-snug">
          {item.question}
        </h3>

        <div className="space-y-2.5">
          {item.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === item.correctIndex;
            return (
              <button
                key={option}
                onClick={() => onSelect(index)}
                disabled={answered}
                className={cn(
                  'w-full min-h-11 text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200',
                  FOCUS_RING,
                  !answered &&
                    'border-[var(--walnut-border)] bg-[var(--felt)] text-[var(--ivory-dim)] hover:border-[var(--brass)]/50',
                  answered &&
                    isCorrectOption &&
                    'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                  answered &&
                    isSelected &&
                    !isCorrectOption &&
                    'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
                  answered && !isSelected && !isCorrectOption && 'opacity-40',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-numeric">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {answered && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                  {answered && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-4 rounded-lg p-4 text-sm leading-relaxed border',
              isCorrect
                ? 'bg-[var(--poker-success-bg)] border-[var(--poker-success)]/30 text-[var(--poker-success)]/90'
                : 'bg-[var(--poker-danger-bg)] border-[var(--poker-danger)]/30 text-[var(--danger-text)]/90',
            )}
          >
            <p className="font-semibold mb-1">
              {isCorrect
                ? t('academy.quiz.correctMark')
                : t('academy.quiz.wrongMark')}
            </p>
            <p>{item.explanation}</p>
            <p className="mt-2 text-[11px] text-[var(--ivory-muted)]">
              {checkpointText(t, 'sourceLesson', '来源课时：{{lessonId}}', {
                lessonId: question.lessonId,
              })}
            </p>
          </motion.div>
        )}

        {answered && (
          <div className="mt-5 flex justify-end">
            <Button variant="default" onClick={onNext} className="min-h-11">
              {isLast
                ? checkpointText(t, 'finish', '查看结果')
                : t('academy.quiz.next')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

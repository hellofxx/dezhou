/**
 * 单题卡片组件：渲染场景、手牌、选项、五级反馈。
 *
 * 五级反馈面板已拆至 PuzzleCardFeedback.tsx（复用 GRADE_DISPLAY_CONFIG）。
 * 支持三种模式（rush / daily / theme），Rush 模式下额外显示连对数与剩余命。
 */
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { PuzzleCardFeedback } from './PuzzleCardFeedback';
import { InfoChip, RushStatusBar } from './PuzzleCardChrome';
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
          <RushStatusBar lives={lives} streak={streak} bonusFeedback={bonusFeedback} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
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
            <PuzzleCardFeedback
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

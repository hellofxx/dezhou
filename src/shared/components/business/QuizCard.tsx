import { useEffect, useCallback, useMemo, useState } from 'react';

import { Trans, useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { RangeAction } from '@/shared/types/poker';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';
import type { QuizQuestion, QuestionFeedback } from '@/shared/types/quiz';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { PokerCard } from '@/shared/components/poker/Card';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import { GradeIcon } from '@/shared/components/feedback/GradeIcon';
import { renderMentorFeedback } from '@/shared/constants/mentorStyles';
import type { MentorStyle } from '@/shared/types/mentor';
import { DEFAULT_MENTOR } from '@/shared/types/mentor';
// 教育脚手架（DESIGN.md §13.4）：决策分析区 / 相关课程标签
import { DecisionAnalysis } from '@/shared/components/feedback/DecisionAnalysis';
// §13.7.2：移动端反馈底部 Sheet
import { MobileFeedbackSheet } from '@/shared/components/feedback/MobileFeedbackSheet';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import {
  ACTION_BUTTONS,
  getActionLabel,
  getHandDisplayName,
  getSuitedColor,
  getSuitedLabel,
  notationToCards,
} from './quizCardModel';

export interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (action: RangeAction) => void;
  timeRemaining: number;
  timeLimit: number;
  feedback?: QuestionFeedback | null;
  /** 五级反馈（可选）。提供时优先使用五级显示，否则降级为旧的二元显示 */
  decisionFeedback?: DecisionFeedback | null;
  /** 导师风格（由调用方从 progress store 注入；缺省 strict-math） */
  mentorStyle?: MentorStyle;
  disabled?: boolean;
  /** 手动推进下一题（反馈卡 / 移动 Sheet 底部按钮由调用方驱动） */
  onNext?: () => void;
}

export function QuizCard({
  question,
  onAnswer,
  feedback,
  decisionFeedback,
  disabled,
  mentorStyle = DEFAULT_MENTOR,
  onNext,
}: QuizCardProps) {
  const { t } = useTranslation();
  const { suited } = getHandDisplayName(question.hand);
  const heroCards = useMemo(() => notationToCards(question.hand), [question.hand]);

  // 五级反馈配置（decisionFeedback 提供时使用，否则降级为旧二元显示）
  const grade = decisionFeedback?.grade ?? null;
  const gradeConfig = grade ? GRADE_DISPLAY_CONFIG[grade] : null;
  const showGradeFeedback = !!(gradeConfig && decisionFeedback);
  
  // P2-4：优先使用 mentorStyle 渲染人格化文案；缺省时降级到 i18n
  // （feedback.message.* / feedback.grade.* 双语 key 已齐备，不再使用中文 defaultValue 兖底）
  const mentorMessage = decisionFeedback && grade
    ? renderMentorFeedback(mentorStyle, grade, {
        evLoss: Number((decisionFeedback.evLoss ?? 0).toFixed(2)),
        correctAction: decisionFeedback.correctAction,
      }, t)
    : '';
  const gradeMessage = mentorMessage || (decisionFeedback && grade
    ? t(`feedback.message.${grade}`, {
        evLoss: (decisionFeedback.evLoss ?? 0).toFixed(2),
      })
    : '');
  const gradeTitle = gradeConfig
    ? t(gradeConfig.titleKey)
    : '';

  // §13.4 教育脚手架：wrong/blunder 级别默认展开决策分析，并显示"再做一题"
  const isWrongOrBlunder = grade === 'wrong' || grade === 'blunder';
  const userActionLabel = decisionFeedback && feedback?.userAction
    ? getActionLabel(t, feedback.userAction)
    : undefined;
  const gtoActionLabel = decisionFeedback?.correctAction
    ? getActionLabel(t, decisionFeedback.correctAction)
    : undefined;
  // explanation 可能存 i18n key（如 rangeTrainer.feedback.optimalAction），展开时转译为展示文案
  const differenceText =
    isWrongOrBlunder && decisionFeedback?.explanation
      ? t(decisionFeedback.explanation, {
          action: gtoActionLabel ?? decisionFeedback.correctAction,
          defaultValue: decisionFeedback.explanation,
        })
      : undefined;

  // §13.7.2：移动端（<768px）答题反馈改用底部 Sheet，桌面端保持内联反馈卡片
  const isMobile = useIsMobile();
  // 移动端 Sheet 开关：反馈出现后自动打开，用户可遮罩关闭（不清答题状态）
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasFeedback = !!feedback || (showGradeFeedback && !!decisionFeedback);
  useEffect(() => {
    // 反馈出现时自动打开；用户关闭后保持关闭，直到反馈结束/下一题再重置
    setSheetOpen(hasFeedback);
  }, [hasFeedback]);

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case '1':
          onAnswer('fold');
          break;
        case '2':
          onAnswer('call');
          break;
        case '3':
          onAnswer('raise');
          break;
      }
    },
    [disabled, onAnswer],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${question.hand}-${question.id ?? ''}`}
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -60 }}
        transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.out }}
        className="flex flex-col items-center gap-8 w-full max-w-md mx-auto"
      >
        {/* 位置 + 上下文 */}
        <div className="flex items-center gap-3">
          <PositionBadge position={question.position} active />
          {question.context && (
            <span className="text-sm text-[var(--ivory-dim)]">
              {question.context}
            </span>
          )}
        </div>

        {/* 手牌展示 — 使用 PokerCard 组件 */}
        <div className="relative">
          <div className="flex gap-3 justify-center">
            {heroCards.map((card, i) => (
              <PokerCard
                key={`${card.rank}-${card.suit}-${i}`}
                card={card}
                size="md"
                animationDelay={0.1 + i * 0.1}
              />
            ))}
          </div>
          {/* 手牌类型标签 */}
          <div className="text-center mt-2">
            <span className={`text-xs font-numeric font-medium tracking-wider ${getSuitedColor(suited)}`}>
              {question.hand} · {getSuitedLabel(t, suited)}
            </span>
          </div>
        </div>

        {/* 提示文字 */}
        <p className="text-sm text-[var(--ivory-muted)] text-center">
          <Trans
            i18nKey="rangeTrainer.quizCard.prompt"
            components={{
              raise: <span className="text-[var(--brass-bright)] font-medium" />,
              call: <span className="text-[var(--ivory-dim)] font-medium" />,
              fold: <span className="text-[var(--danger-text)] font-medium" />,
            }}
            defaults="这手牌应该 <raise>Raise</raise>、<call>Call</call> 还是 <fold>Fold</fold>？"
          />
        </p>

        {/* 动作按钮 — §5.5 风险色阶：fold 陶土透底 / call 深胡桃 / raise 黄铜渐变 */}
        <div className="flex gap-4 w-full">
          {ACTION_BUTTONS.map(({ action, label, shortcut, colorClass }) => {
            return (
              <motion.button
                key={action}
                onClick={() => onAnswer(action)}
                disabled={disabled}
                className={`flex-1 py-4 rounded-md border font-display font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${colorClass}`}
                whileHover={{ scale: disabled ? 1 : 1.04 }}
                whileTap={{ scale: disabled ? 1 : 0.96 }}
              >
                <div>{label}</div>
                <div className="text-xs font-numeric opacity-70 mt-0.5">{shortcut}</div>
              </motion.button>
            );
          })}
        </div>

        {/* 反馈显示：五级反馈优先，否则降级为旧二元显示。
            §13.7.2：移动端（<768px）渲染进底部 Sheet，桌面端保持内联卡片 */}
        {isMobile ? (
          <MobileFeedbackSheet
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          >
            {renderFeedbackContent()}
          </MobileFeedbackSheet>
        ) : (
          <AnimatePresence>{renderFeedbackContent()}</AnimatePresence>
        )}

        {isMobile && hasFeedback && !sheetOpen && (
          <div className="flex w-full items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="min-h-11 rounded border border-[var(--walnut-border)] px-4 py-2 text-sm text-[var(--ivory-dim)] transition-colors hover:bg-[var(--walnut-raised)]"
            >
              {t('rangeTrainer.quizCard.viewFeedback')}
            </button>
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="min-h-11 rounded bg-gradient-to-b from-[var(--brass-bright)] to-[var(--brass)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)]"
              >
                {t('rangeTrainer.quizCard.next')}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  /** 反馈底部推进按钮：答错沿用「再做一题」语义，答对显示「下一题」 */
  function renderAdvanceButton() {
    if (!onNext) return null;
    const label = isWrongOrBlunder
      ? t('feedback.tryAgain')
      : t('rangeTrainer.quizCard.next');
    return (
      <button
        type="button"
        onClick={onNext}
        className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded border border-[var(--brass)]/40 bg-[var(--brass)]/10 px-4 py-2 text-sm font-medium text-[var(--brass-text)] transition-colors hover:bg-[var(--brass)]/20"
      >
        {label}
        <kbd className="hidden rounded border border-current/30 px-1 font-numeric text-[10px] opacity-70 sm:inline">
          Space
        </kbd>
      </button>
    );
  }

  /** 反馈内容本体（桌面端内联 / 移动端 Sheet 共用） */
  function renderFeedbackContent() {
    return (
      <>
        {showGradeFeedback && decisionFeedback && gradeConfig && grade ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className={`w-full p-4 rounded-md border text-left ${gradeConfig.color} ${gradeConfig.textColor}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GradeIcon grade={grade} size={24} />
                <div className="font-display font-semibold">{gradeTitle}</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80">{t('feedback.evLossLabel')}</div>
                <div className="text-lg font-bold font-numeric">{decisionFeedback.evLoss.toFixed(2)} BB</div>
              </div>
              {grade !== 'best' && decisionFeedback.correctAction && (
                <div className="text-right">
                  <div className="text-xs opacity-80">{t('feedback.correctAction')}</div>
                  <div className="text-sm font-bold font-numeric">{decisionFeedback.correctAction}</div>
                </div>
              )}
            </div>
            <div className="text-sm mt-2 opacity-95 space-y-1">
              <div>{gradeMessage}</div>
              {/* §13.4 教育脚手架：wrong/blunder 默认展开决策分析（含对比视图/差异原因/相关课程），底部再做一题 */}
              {isWrongOrBlunder && (
                <DecisionAnalysis
                  userAction={userActionLabel}
                  gtoAction={gtoActionLabel}
                  difference={differenceText}
                  relatedLessonId={decisionFeedback.relatedLessonId}
                  defaultOpen
                />
              )}
              {onNext && (
                <div className="mt-3 flex justify-end">
                  {renderAdvanceButton()}
                </div>
              )}
            </div>
          </motion.div>
        ) : feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className={`w-full p-4 rounded-md border text-center ${
              feedback.isCorrect
                ? 'bg-[var(--sage)]/12 border-[var(--sage)]/40 text-[var(--sage-text)]'
                : 'bg-[var(--clay)]/12 border-[var(--clay)]/40 text-[var(--clay-text)]'
            }`}
          >
            {feedback.isCorrect ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [0.8, 1.1, 1] }}
                transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.spring }}
                className="text-xl font-display font-semibold"
              >
                {t('rangeTrainer.quizCard.correct')}
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: [-8, 8, -6, 6, -3, 3, 0] }}
                animate={{ x: 0 }}
                transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.standard }}
              >
                <div className="text-xl font-display font-semibold">{t('rangeTrainer.quizCard.wrong')}</div>
                <div className="text-sm mt-1 opacity-90 font-body">
                  {t('rangeTrainer.quizCard.correctAnswerIs', { action: feedback.correctAction })}
                  {feedback.correctAction === 'raise'
                    ? ` ${t('rangeTrainer.quizCard.inRange')}`
                    : feedback.correctAction === 'fold'
                    ? ` ${t('rangeTrainer.quizCard.notInRange')}`
                    : ` ${t('rangeTrainer.quizCard.suitableCall')}`}
                </div>
              </motion.div>
            )}
            {onNext && (
              <div className="mt-3 flex justify-end">
                {renderAdvanceButton()}
              </div>
            )}
          </motion.div>
        ) : null}
      </>
    );
  }
}

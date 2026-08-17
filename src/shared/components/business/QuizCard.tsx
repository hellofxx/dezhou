import { useEffect, useCallback, useMemo } from 'react';

import { Trans, useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { RangeAction, Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';
import type { QuizQuestion, QuestionFeedback } from '@/shared/types/quiz';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { PokerCard } from '@/shared/components/poker/Card';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import { renderMentorFeedback } from '@/shared/constants/mentorStyles';
import type { MentorStyle } from '@/shared/types/mentor';
import { DEFAULT_MENTOR } from '@/shared/types/mentor';
// 教育脚手架（DESIGN_LANGUAGE §13.4）：决策分析区 / 再看一题 / 相关课程标签
import { DecisionAnalysis } from '@/shared/components/feedback/DecisionAnalysis';
import { TryAgainButton } from '@/shared/components/feedback/TryAgainButton';

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
  /** §13.4.3 教育脚手架：wrong/blunder 反馈底部"再做一题"回调（由调用方驱动下一题，不清除当前反馈） */
  onTryAgain?: () => void;
}

/** 将动作映射为展示标签（§13.4 对比视图用） */
function getActionLabel(t: TFunction, action: string): string {
  if (action === 'fold') return t('rangeTrainer.srs.optionFold');
  if (action === 'call') return t('rangeTrainer.srs.optionCall');
  if (action === 'raise') return t('rangeTrainer.srs.optionRaise');
  return action;
}

/** 解析手牌 notation 为展示用名称 */
function getHandDisplayName(hand: string): { rank1: string; rank2: string; suited: string } {
  const rankMap: Record<string, string> = {
    'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2',
  };

  if (hand.length === 2) {
    // 对子
    return { rank1: rankMap[hand[0]!] ?? hand[0]!, rank2: rankMap[hand[1]!] ?? hand[1]!, suited: 'pair' };
  }

  const rank1 = rankMap[hand[0]!] ?? hand[0]!;
  const rank2 = rankMap[hand[1]!] ?? hand[1]!;
  const suited = hand.endsWith('s') ? 'suited' : 'offsuit';

  return { rank1, rank2, suited };
}

const CHAR_TO_RANK: Record<string, Rank> = {
  '2': Rank.Two, '3': Rank.Three, '4': Rank.Four, '5': Rank.Five,
  '6': Rank.Six, '7': Rank.Seven, '8': Rank.Eight, '9': Rank.Nine,
  'T': Rank.Ten, 'J': Rank.Jack, 'Q': Rank.Queen, 'K': Rank.King, 'A': Rank.Ace,
};

/** 将手牌 notation 转换为代表性 Card 对象（用于 PokerCard 渲染） */
function notationToCards(hand: string): Card[] {
  if (hand.length === 2) {
    // 对子：两张不同花色的相同点数
    const rank = CHAR_TO_RANK[hand[0]!] ?? Rank.Ace;
    return [
      { suit: Suit.Spades, rank },
      { suit: Suit.Hearts, rank },
    ];
  }
  const rank1 = CHAR_TO_RANK[hand[0]!] ?? Rank.Ace;
  const rank2 = CHAR_TO_RANK[hand[1]!] ?? Rank.King;
  if (hand.endsWith('s')) {
    // 同花：两张相同花色
    return [
      { suit: Suit.Spades, rank: rank1 },
      { suit: Suit.Spades, rank: rank2 },
    ];
  }
  // 非同花：不同花色
  return [
    { suit: Suit.Spades, rank: rank1 },
    { suit: Suit.Hearts, rank: rank2 },
  ];
}

function getSuitedLabel(t: TFunction, suited: string): string {
  if (suited === 'pair') return t('rangeTrainer.quizCard.pair');
  if (suited === 'suited') return t('rangeTrainer.quizCard.suited');
  return t('rangeTrainer.quizCard.offsuit');
}

function getSuitedColor(suited: string): string {
  // Pairs glow warmest (gold); suited hands cool (sage); offsuit dimmest.
  if (suited === 'pair') return 'text-[var(--brass-bright)]';
  if (suited === 'suited') return 'text-[var(--sage)]';
  return 'text-[var(--ivory-muted)]';
}

// Action palette per DESIGN_LANGUAGE §5.5 risk ladder, tuned for three equal-weight
// answer options (not one CTA + two muted): each button keeps its card-room hue
// (fold=terracotta / call=neutral walnut / raise=brass) and sits clearly above the
// felt background so all three read distinctly.
// RNG-02：fold 陶土红改用 token（--poker-terra 系列），消除 rgba 硬编码
const ACTION_BUTTONS: { action: RangeAction; label: string; shortcut: string; colorClass: string }[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', colorClass: 'bg-[var(--poker-terra)]/15 text-[var(--poker-terra-bright)] border-[var(--poker-terra)]/50 hover:bg-[var(--poker-terra)]/25' },
  { action: 'call', label: 'Call', shortcut: '2', colorClass: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)] border-[var(--walnut-light)] hover:bg-[var(--walnut-light)] hover:text-[var(--ivory)]' },
  { action: 'raise', label: 'Raise', shortcut: '3', colorClass: 'hover-bright bg-gradient-to-b from-[var(--brass-bright)] to-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass-dark)]' },
];

export function QuizCard({
  question,
  onAnswer,
  feedback,
  decisionFeedback,
  disabled,
  mentorStyle = DEFAULT_MENTOR,
  onTryAgain,
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
        key={question.hand}
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
              fold: <span className="text-[var(--poker-danger)] font-medium" />,
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

        {/* 反馈显示：五级反馈优先，否则降级为旧二元显示 */}
        <AnimatePresence>
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
                  <span className="font-display text-2xl">{gradeConfig.icon}</span>
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
                {isWrongOrBlunder && onTryAgain && (
                  <div className="mt-3 flex justify-end">
                    <TryAgainButton onTryAgain={onTryAgain} />
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
                  ? 'bg-[var(--sage)]/12 border-[var(--sage)]/40 text-[var(--sage)]'
                  : 'bg-[var(--clay)]/12 border-[var(--clay)]/40 text-[var(--clay)]'
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

import { useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { RangeAction, Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import type { QuizQuestion, QuestionFeedback } from '../types';
import { PositionBadge } from '@/shared/components/PositionBadge';
import { PokerCard } from '@/shared/components/Card';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import { renderMentorFeedback } from '@/shared/constants/mentorStyles';
import { useProgressStore } from '@/features/progress/store';

interface QuizCardProps {
  question: QuizQuestion;
  onAnswer: (action: RangeAction) => void;
  timeRemaining: number;
  timeLimit: number;
  feedback?: QuestionFeedback | null;
  /** 五级反馈（可选）。提供时优先使用五级显示，否则降级为旧的二元显示 */
  decisionFeedback?: DecisionFeedback | null;
  disabled?: boolean;
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

function getSuitedLabel(suited: string): string {
  if (suited === 'pair') return '对子';
  if (suited === 'suited') return '同花';
  return '非同花';
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
const ACTION_BUTTONS: { action: RangeAction; label: string; shortcut: string; colorClass: string }[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', colorClass: 'bg-[rgba(194,90,76,0.16)] text-[var(--poker-danger)] border-[rgba(194,90,76,0.55)] hover:bg-[rgba(194,90,76,0.26)]' },
  { action: 'call', label: 'Call', shortcut: '2', colorClass: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)] border-[var(--walnut-light)] hover:bg-[var(--walnut-light)] hover:text-[var(--ivory)]' },
  { action: 'raise', label: 'Raise', shortcut: '3', colorClass: 'bg-gradient-to-b from-[var(--brass-bright)] to-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass-dark)] hover:brightness-105' },
];

export function QuizCard({ question, onAnswer, feedback, decisionFeedback, disabled }: QuizCardProps) {
  const { t } = useTranslation();
  const { suited } = getHandDisplayName(question.hand);
  const heroCards = useMemo(() => notationToCards(question.hand), [question.hand]);

  // 五级反馈配置（decisionFeedback 提供时使用，否则降级为旧二元显示）
  const grade = decisionFeedback?.grade ?? null;
  const gradeConfig = grade ? GRADE_DISPLAY_CONFIG[grade] : null;
  const showGradeFeedback = !!(gradeConfig && decisionFeedback);

  // 五级反馈默认文案兜底（i18n key 缺失时使用）
  const defaultGradeMessage =
    grade === 'best'
      ? '最优决策！🌟'
      : grade === 'correct'
        ? '正确！这个决策是合理的'
        : grade === 'inaccuracy'
          ? '不太精确，还有更好的选择'
          : grade === 'wrong'
            ? `这个决策损失了 ${(decisionFeedback?.evLoss ?? 0).toFixed(2)} BB`
            : grade === 'blunder'
              ? `严重错误！损失了 ${(decisionFeedback?.evLoss ?? 0).toFixed(2)} BB`
              : '';
  // P2-4：优先使用 mentorStyle 渲染人格化文案；缺省时降级到 i18n
  const mentorStyle = useProgressStore((s) => s.mentorStyle);
  const mentorMessage = decisionFeedback && grade
    ? renderMentorFeedback(mentorStyle, grade, {
        evLoss: Number((decisionFeedback.evLoss ?? 0).toFixed(2)),
        correctAction: decisionFeedback.correctAction,
      }, t)
    : '';
  const gradeMessage = mentorMessage || (decisionFeedback && grade
    ? t(`feedback.message.${grade}`, {
        evLoss: (decisionFeedback.evLoss ?? 0).toFixed(2),
        defaultValue: defaultGradeMessage,
      })
    : '');
  const gradeTitle = gradeConfig
    ? t(gradeConfig.titleKey, { defaultValue: defaultGradeMessage })
    : '';

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
        transition={{ duration: 0.3, ease: 'easeOut' }}
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
              {question.hand} · {getSuitedLabel(suited)}
            </span>
          </div>
        </div>

        {/* 提示文字 */}
        <p className="text-sm text-[var(--ivory-muted)] text-center">
          这手牌应该 <span className="text-[var(--brass-bright)] font-medium">Raise</span>、
          <span className="text-[var(--ivory-dim)] font-medium">Call</span> 还是
          <span className="text-[var(--poker-danger)] font-medium">Fold</span>？
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
              transition={{ duration: 0.3 }}
              className={`w-full p-4 rounded-md border text-left ${gradeConfig.color} ${gradeConfig.textColor}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl">{gradeConfig.icon}</span>
                  <div className="font-display font-semibold">{gradeTitle}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">{t('feedback.evLossLabel', { defaultValue: 'EV 损失' })}</div>
                  <div className="text-lg font-bold font-numeric">{decisionFeedback.evLoss.toFixed(2)} BB</div>
                </div>
                {grade !== 'best' && decisionFeedback.correctAction && (
                  <div className="text-right">
                    <div className="text-xs opacity-80">{t('feedback.correctAction', { defaultValue: '最优动作' })}</div>
                    <div className="text-sm font-bold font-numeric">{decisionFeedback.correctAction}</div>
                  </div>
                )}
              </div>
              <div className="text-sm mt-2 opacity-95 space-y-1">
                <div>{gradeMessage}</div>
                {(grade === 'wrong' || grade === 'blunder') && decisionFeedback.explanation && (
                  <div className="text-xs opacity-90">{decisionFeedback.explanation}</div>
                )}
                {(grade === 'wrong' || grade === 'blunder') && decisionFeedback.relatedLessonId && (
                  <Link
                    to={`/academy/lesson/${decisionFeedback.relatedLessonId}`}
                    className="inline-flex items-center gap-1 text-xs font-display font-semibold underline underline-offset-2 hover:opacity-80"
                  >
                    {t('feedback.goReview', { defaultValue: '去复习 →' })}
                  </Link>
                )}
              </div>
            </motion.div>
          ) : feedback ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.5 }}
                  className="text-xl font-display font-semibold"
                >
                  ✓ 正确！
                </motion.div>
              ) : (
                <motion.div
                  initial={{ x: [-8, 8, -6, 6, -3, 3, 0] }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-xl font-display font-semibold">✗ 错误</div>
                  <div className="text-sm mt-1 opacity-90 font-body">
                    正确答案是 <span className="font-bold capitalize font-numeric">{feedback.correctAction}</span>
                    {feedback.correctAction === 'raise'
                      ? ' — 这手牌在标准范围内'
                      : feedback.correctAction === 'fold'
                      ? ' — 这手牌不在标准范围内'
                      : ' — 这手牌适合跟注'}
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

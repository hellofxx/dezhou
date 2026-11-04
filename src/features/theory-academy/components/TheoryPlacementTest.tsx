import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Compass, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useTheoryStore } from '../store';
import {
  PLACEMENT_BASICS_ROUTE,
  PLACEMENT_PREREQUISITE_KEYS,
  createPlacementResult,
  evaluatePlacement,
  orderPlacementOptions,
  placementLevelTitleKey,
  type PlacementEvaluation,
} from '../utils/placement';
import {
  PLACEMENT_OPTION_COUNT,
  PLACEMENT_QUESTION_COUNT,
  THEORY_PLACEMENT_QUESTIONS,
  placementExplanationKey,
  placementOptionKey,
  placementQuestionKey,
} from '../data/placementQuestions';
import { theoryLevelTitleKey } from '../utils/titleKeys';

interface TheoryPlacementTestProps {
  /** 退出入口（由宿主页面决定返回目录或关闭弹层）；缺省时不渲染退出按钮 */
  onExit?: () => void;
  className?: string;
}

/**
 * 理论定位测评（16 题，T1–T6 概念）。
 *
 * 唯一持久化副作用是 `recordPlacement`（creditLevels 取并集、单调不减）：
 * - 绝不写 completedChapters（免修只放宽解锁，目录里仍显示为未读）；
 * - 不写 ELO / SRS / 掌握度（`chapterAttempts` 与 `quizScores` 一概不动）。
 *
 * 选项顺序经 `orderPlacementOptions` 出口重排（数值升序 / hash(id) 种子洗牌），
 * 正确项位置随题 id 分散，且 zh/en 顺序一致。
 */
export function TheoryPlacementTest({ onExit, className }: TheoryPlacementTestProps) {
  const { t } = useTranslation();
  const recordPlacement = useTheoryStore((s) => s.recordPlacement);
  const previousPlacement = useTheoryStore((s) => s.progress.placement);

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [evaluation, setEvaluation] = useState<PlacementEvaluation | null>(null);

  const question = THEORY_PLACEMENT_QUESTIONS[currentIndex];
  // 选项文案先 t() 解析，再走排序出口（种子只依赖题 id，语言无关）
  const orderedOptions = useMemo(() => {
    if (!question) return [];
    const texts = Array.from({ length: PLACEMENT_OPTION_COUNT }, (_, index) =>
      t(placementOptionKey(question.id, index)),
    );
    return orderPlacementOptions(question.id, texts, question.correctIndex);
  }, [question, t]);

  const start = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setSelectedIndex(null);
    setAnswered(false);
    setEvaluation(null);
    setPhase('quiz');
  };

  const handleSelect = (originalIndex: number) => {
    if (answered || !question) return;
    setSelectedIndex(originalIndex);
    setAnswered(true);
    if (originalIndex === question.correctIndex) setCorrectCount((count) => count + 1);
  };

  const handleNext = () => {
    if (currentIndex >= PLACEMENT_QUESTION_COUNT - 1) {
      const nextCorrect = correctCount;
      const result = evaluatePlacement(nextCorrect, PLACEMENT_QUESTION_COUNT);
      setEvaluation(result);
      // 只写 placement：creditLevels 由 store 取并集（重测不降级）
      recordPlacement(createPlacementResult(result, Date.now()));
      setPhase('result');
      return;
    }
    setCurrentIndex((index) => index + 1);
    setSelectedIndex(null);
    setAnswered(false);
  };

  if (phase === 'result' && evaluation) {
    return (
      <div className={cn('panel space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
          <h2 className="font-display text-lg text-[var(--ivory)]">{t('theory.placement.resultTitle')}</h2>
        </div>
        <p className="font-numeric text-3xl text-[var(--brass-bright)]">
          {t('theory.placement.score', {
            correct: evaluation.correct,
            total: evaluation.total,
            score: evaluation.score,
          })}
        </p>
        <p className="text-sm text-[var(--ivory)]">
          {t('theory.placement.recommendedLevel', {
            level: t(placementLevelTitleKey(evaluation.recommendedLevelId)),
          })}
        </p>

        {evaluation.creditLevels.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-[var(--ivory-muted)]">
              {t('theory.placement.creditLevels', {
                levels: evaluation.creditLevels.map((id) => t(theoryLevelTitleKey(id))).join(' · '),
              })}
            </p>
            <ul className="flex flex-wrap gap-2">
              {evaluation.creditLevels.map((id) => (
                <li
                  key={id}
                  className="rounded-sm border border-[var(--sage)]/40 bg-[var(--sage)]/10 px-2 py-1 text-[11px] text-[var(--sage-text)]"
                >
                  {id.toUpperCase()} · {t(theoryLevelTitleKey(id))}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)]/40 p-4 space-y-2">
            <p className="text-sm font-semibold text-[var(--ivory)]">{t('theory.placement.zeroBasedTitle')}</p>
            <p className="text-xs text-[var(--ivory-muted)]">{t('theory.placement.zeroBasedBody')}</p>
            <div>
              <p className="text-xs font-semibold text-[var(--ivory-dim)] mb-1">
                {t('theory.placement.prereq.title')}
              </p>
              <ul className="space-y-1">
                {PLACEMENT_PREREQUISITE_KEYS.map((key) => (
                  <li key={key} className="text-xs text-[var(--ivory-muted)]">
                    · {t(`theory.placement.prereq.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to={PLACEMENT_BASICS_ROUTE}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm text-[var(--brass-text)] hover:text-[var(--brass-bright)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
            >
              {t('theory.placement.basicsCta')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        <p className="text-xs text-[var(--ivory-muted)]">{t('theory.placement.disclaimer')}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={start}
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            {t('theory.placement.retake')}
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-sm text-[var(--ivory)] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              {t('theory.chapterView.backToChapters')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && question) {
    return (
      <div className={cn('panel space-y-5', className)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base text-[var(--ivory)]">{t('theory.placement.title')}</h2>
          <p className="text-xs font-numeric text-[var(--ivory-muted)]">
            {t('theory.placement.questionOf', {
              current: currentIndex + 1,
              total: PLACEMENT_QUESTION_COUNT,
            })}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={PLACEMENT_QUESTION_COUNT}
          aria-label={t('theory.placement.questionOf', {
            current: currentIndex + 1,
            total: PLACEMENT_QUESTION_COUNT,
          })}
        >
          {Array.from({ length: PLACEMENT_QUESTION_COUNT }, (_, index) => (
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

        <h3 className="font-display text-[17px] leading-snug text-[var(--ivory)]">
          {t(placementQuestionKey(question.id))}
        </h3>

        <div className="space-y-2.5">
          {orderedOptions.map((option) => {
            const isSelected = selectedIndex === option.originalIndex;
            const showCorrect = answered && option.isCorrect;
            const showWrong = answered && isSelected && !option.isCorrect;
            return (
              <button
                key={option.originalIndex}
                onClick={() => handleSelect(option.originalIndex)}
                disabled={answered}
                className={cn(
                  'w-full min-h-11 text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                  !answered &&
                    'border-[var(--walnut-border)] bg-[var(--felt)] text-[var(--ivory-dim)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40',
                  showCorrect && 'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                  showWrong && 'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
                  answered &&
                    !showCorrect &&
                    !showWrong &&
                    'border-[var(--walnut-border)]/50 bg-[var(--felt)]/50 text-[var(--ivory-muted)] opacity-60',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex-1">{option.text}</span>
                  {showCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  {showWrong && <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)]/40 p-4 text-sm leading-relaxed text-[var(--ivory-dim)]">
            {t(placementExplanationKey(question.id))}
          </div>
        )}

        {answered && (
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              {currentIndex >= PLACEMENT_QUESTION_COUNT - 1
                ? t('theory.placement.finish')
                : t('theory.placement.next')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('panel space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Compass className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
        <h2 className="font-display text-lg text-[var(--ivory)]">{t('theory.placement.title')}</h2>
      </div>
      <p className="text-sm text-[var(--ivory-dim)]">{t('theory.placement.subtitle')}</p>
      <p className="text-xs text-[var(--ivory-muted)]">{t('theory.placement.intro')}</p>
      {previousPlacement && (
        <p className="rounded-sm border border-[var(--sage)]/40 bg-[var(--sage)]/10 px-3 py-2 text-[11px] text-[var(--sage-text)]">
          {t('theory.placement.recommendedLevel', {
            level: t(theoryLevelTitleKey(previousPlacement.recommendedLevelId)),
          })}
        </p>
      )}
      <p className="text-xs text-[var(--ivory-muted)]">{t('theory.placement.disclaimer')}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={start}
          className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        >
          {t('theory.placement.start')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        {onExit && (
          <button
            onClick={onExit}
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            {t('theory.chapterView.backToChapters')}
          </button>
        )}
      </div>
    </div>
  );
}

export default TheoryPlacementTest;

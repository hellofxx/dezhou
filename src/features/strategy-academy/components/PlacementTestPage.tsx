import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { motion } from 'framer-motion';
import { Check, Compass, X } from 'lucide-react';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { transitionSlow } from '@/shared/utils/motion';
import { useAcademyStore } from '../store';
import { useAcademyCourseI18n } from '../hooks/useAcademyCourseI18n';
import { PLACEMENT_QUESTIONS } from '../data/placementQuestions';
import {
  buildPlacementOutcome,
  countCorrect,
  placementTopicKey,
  resolvePlacementQuestion,
  type PlacementOutcome,
} from '../utils/placement';
import { findLevelSummaryById } from '../utils/academyMeta';
import { levelTitleKey } from '../utils/titleKeys';
import PlacementResultView from './PlacementResultView';

/** 定位测评题库文案文件（question bank 独立于 academy.json） */
const PLACEMENT_I18N_FILES = ['placement'] as const;

type PlacementPhase = 'intro' | 'quiz' | 'result';

/**
 * 策略定位测评页（P1）。
 *
 * 流程：说明 → 16 题（逐题作答 + 解析）→ 结果（推荐起点 / 免修范围 / 重测）。
 * 写入口径：只调用 `recordPlacement`（结果只放宽 `creditLevels` 门禁），
 * **绝不写 completedLessons**；重测由 store 侧并集处理，不降级。
 */
export default function PlacementTestPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const contentReady = useAcademyCourseI18n(PLACEMENT_I18N_FILES);
  const recordPlacement = useAcademyStore((s) => s.recordPlacement);
  const existingPlacement = useAcademyStore((s) => s.placement);

  const [phase, setPhase] = useState<PlacementPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<PlacementOutcome | null>(null);

  // 选项先 t() 解析再重排（种子只依赖 id ⇒ zh/en 顺序一致，correctIndex 同步重映射）
  const resolvedQuestions = useMemo(
    () => PLACEMENT_QUESTIONS.map((question) => resolvePlacementQuestion(t, question)),
    [t],
  );
  const activeQuestion = resolvedQuestions[questionIndex];
  const totalQuestions = resolvedQuestions.length;

  const introPoints = [
    t('academy.placement.page.intro.what', {
      defaultValue: '16 道概念题，覆盖牌型、位置、赔率、翻前范围、C-bet、EV、GTO 与 ICM。',
    }),
    t('academy.placement.page.intro.how', {
      defaultValue: '答完立即给出推荐起点与免修范围，随时可以重测。',
    }),
    t('academy.placement.page.intro.limit', {
      defaultValue: '结果只放宽解锁，不计完成；最高免修到 L4B。',
    }),
  ];

  const levelLabel = (levelId: string): string =>
    t(levelTitleKey(levelId), {
      defaultValue: findLevelSummaryById(levelId)?.title ?? levelId,
    });

  const handleStart = () => {
    setPhase('quiz');
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
    setOutcome(null);
  };

  const handleSelect = (optionIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
  };

  const handleAdvance = () => {
    if (selectedIndex === null) return;
    const nextAnswers = [...answers, selectedIndex];
    setAnswers(nextAnswers);
    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedIndex(null);
      return;
    }
    const nextOutcome = buildPlacementOutcome(
      countCorrect(resolvedQuestions, nextAnswers),
      totalQuestions,
    );
    recordPlacement({
      recommendedLevelId: nextOutcome.recommendedLevelId,
      creditLevels: nextOutcome.creditLevels,
      correct: nextOutcome.correct,
      total: nextOutcome.total,
    });
    setOutcome(nextOutcome);
    setPhase('result');
  };

  const backToAcademy = () => navigate('/academy');

  if (!contentReady) {
    return (
      <div className="py-6">
        <PageSkeleton />
      </div>
    );
  }
  const backButton = (
    <BackLink
      onClick={backToAcademy}
      label={t('academy.placement.page.back', { defaultValue: '返回学院' })}
      size="md"
    />
  );

  if (phase === 'result' && outcome) {
    return (
      <div className="py-6 space-y-4">
        {backButton}
        <PlacementResultView
          recommendedLevelId={existingPlacement?.recommendedLevelId ?? outcome.recommendedLevelId}
          creditLevels={existingPlacement?.creditLevels ?? outcome.creditLevels}
          correct={outcome.correct}
          total={outcome.total}
          onRetest={handleStart}
          onBack={backToAcademy}
        />
      </div>
    );
  }

  if (phase === 'quiz' && activeQuestion) {
    const isCorrect = selectedIndex === activeQuestion.correctIndex;
    const isLast = questionIndex === totalQuestions - 1;
    const answered = questionIndex + (selectedIndex === null ? 0 : 1);
    const progress = Math.round((answered / totalQuestions) * 100);

    return (
      <div className="py-6 space-y-4">
        {backButton}
        <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--ivory-muted)]">
            <span>
              {t('academy.placement.page.progress', {
                defaultValue: '第 {{current}} / {{total}} 题',
                current: questionIndex + 1,
                total: totalQuestions,
              })}
            </span>
            <span className="rounded-md bg-[var(--brass)]/15 px-2 py-0.5 text-[var(--brass-text)]">
              {t(placementTopicKey(activeQuestion.topic), { defaultValue: activeQuestion.topic })}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brass-fill)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <h2 className="font-display text-lg text-[var(--ivory)] leading-snug">
            {activeQuestion.question}
          </h2>

          <ul className="space-y-2">
            {activeQuestion.options.map((option, optionIndex) => {
              const revealed = selectedIndex !== null;
              const isAnswer = optionIndex === activeQuestion.correctIndex;
              const isPicked = optionIndex === selectedIndex;
              const stateClass = !revealed
                ? 'border-[var(--walnut-border)] bg-[var(--walnut-raised)] hover:border-[var(--brass)]/60'
                : isAnswer
                  ? 'border-[var(--success)] bg-[var(--success-bg)]'
                  : isPicked
                    ? 'border-[var(--danger)] bg-[var(--danger-bg)]'
                    : 'border-[var(--walnut-border)] bg-[var(--walnut-raised)] opacity-70';
              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => handleSelect(optionIndex)}
                    aria-pressed={isPicked}
                    className={`flex items-center justify-between gap-2 w-full min-h-11 px-4 py-2.5 rounded-lg border text-left text-sm text-[var(--ivory)] transition-colors ${stateClass}`}
                  >
                    <span>{option}</span>
                    {revealed && isAnswer ? <Check className="w-4 h-4 shrink-0 text-[var(--success)]" /> : null}
                    {revealed && !isAnswer && isPicked ? <X className="w-4 h-4 shrink-0 text-[var(--danger-text)]" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={transitionSlow}
              className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-4 space-y-2"
            >
              <p
                className={`text-sm font-semibold ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger-text)]'}`}
              >
                {isCorrect
                  ? t('academy.placement.page.correct', { defaultValue: '答对了' })
                  : t('academy.placement.page.incorrect', { defaultValue: '答错了' })}
              </p>
              <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
                <span className="text-[var(--brass-text)] mr-1">
                  {t('academy.placement.page.explanation', { defaultValue: '解析' })}
                </span>
                {activeQuestion.explanation}
              </p>
            </motion.div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdvance}
              disabled={selectedIndex === null}
              className="inline-flex items-center justify-center min-h-11 px-5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLast
                ? t('academy.placement.page.finish', { defaultValue: '查看结果' })
                : t('academy.placement.page.next', { defaultValue: '下一题' })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      {backButton}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionSlow}
        className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-[var(--brass-text)]" />
          </div>
          <div>
            <h2 className="font-display text-2xl text-[var(--ivory)]">
              {t('academy.placement.page.title', { defaultValue: '定位测评' })}
            </h2>
            <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
              {t('academy.placement.page.subtitle', {
                defaultValue: '16 道概念题，帮你找到合适的起点',
              })}
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-[var(--ivory-muted)]">
          {introPoints.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--brass)] shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        {existingPlacement && (
          <p className="text-xs text-[var(--ivory-dim)] rounded-md bg-[var(--walnut-raised)] px-3 py-2">
            {t('academy.placement.page.previous', {
              defaultValue: '上次测评：{{level}}',
              level: levelLabel(existingPlacement.recommendedLevelId),
            })}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          className="w-full min-h-11 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t('academy.placement.page.start', { defaultValue: '开始测评' })}
        </button>
      </motion.div>
    </div>
  );
}

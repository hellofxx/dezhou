import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAcademyStore, REQUIRED_ACCURACY } from '../store';
import type { CertificationAttemptResult } from '../types';
import { useAcademyCourseI18n } from '../hooks/useAcademyCourseI18n';
import { useAcademyLessonsForLevel } from '../hooks/useAcademyLessons';
import { deriveAcademyCourseFilesForLevel } from '@/i18n/academyCourse';
import { getLevelSummariesByNumber } from '../utils/academyMeta';
// 认证题池/抽题：题池 = 该 Level 全部已应用题目，按 cert-level-<n> + 会话种子抽 20 题
import { buildCertificationExam, getCertificationPoolSize } from '../utils/certificationExam';
import {
  getLevelCompletion,
  getLevelTheoryAnchors,
} from '../utils/certificationStatus';
import { resolveQuizQuestion } from '../utils/contentKeys';
import { CertificationIntroView } from './CertificationIntroView';
import { CertificationResultView } from './CertificationResultView';

const BACK_TO_ACADEMY = 'academy.levelCertification.backToAcademy';

export default function LevelCertification() {
  const { t } = useTranslation();
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const level = parseInt(levelParam ?? '1', 10);
  const contentReady = useAcademyCourseI18n(deriveAcademyCourseFilesForLevel(level));

  // 门禁输入：变体 + 完成度 + 证书记录（任一变化都需重算认证状态）
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const completedLessons = useAcademyStore((s) => s.progress.completedLessons);
  const certifications = useAcademyStore((s) => s.certifications);
  const isLevelLessonsCompleted = useAcademyStore((s) => s.isLevelLessonsCompleted);
  const getCertificationState = useAcademyStore((s) => s.getCertificationState);
  const submitCertificationAttempt = useAcademyStore((s) => s.submitCertificationAttempt);

  const levelEntries = useMemo(() => getLevelSummariesByNumber(level), [level]);
  const loadedLessons = useAcademyLessonsForLevel(level);
  const mergedLessons = loadedLessons ?? [];
  const certification = certifications[level];

  const [now, setNow] = useState(() => Date.now());
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcome, setOutcome] = useState<{
    score: number;
    result: CertificationAttemptResult;
  } | null>(null);
  // 会话种子：每次进入/续期题序与选项不同；now 驱动冷却/有效期边界每秒重算
  const [sessionSeed, setSessionSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));

  const certState = useMemo(
    () => getCertificationState(level),
    [getCertificationState, level, activeVariant, completedLessons, certifications, now],
  );
  const ticking =
    certState.status === 'cooldown' ||
    certState.status === 'valid' ||
    certState.status === 'expiring';

  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  // 渲染层 key 覆盖：先解析各课 quiz 文案，再进入种子化抽题（同种子输出稳定）
  const allQuestions = useMemo(
    () =>
      buildCertificationExam(
        mergedLessons.map((lesson) => ({
          ...lesson,
          quiz: lesson.quiz.map((question) => resolveQuizQuestion(t, question)),
        })),
        level,
        sessionSeed,
      ),
    [mergedLessons, level, sessionSeed, t, contentReady],
  );

  if (levelEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--ivory-muted)]">{t('academy.levelCertification.levelNotFound')}</p>
        <button
          onClick={() => navigate('/academy')}
          className="text-sm text-[var(--brass-bright)] hover:underline"
        >
          {t(BACK_TO_ACADEMY)}
        </button>
      </div>
    );
  }

  // URL 直达门禁：非标准变体 / 本级别课程未全部完成 → 只显示锁定原因，不渲染开始按钮
  const levelCompletion = getLevelCompletion(level, completedLessons);
  const variantLocked = activeVariant !== 'standard';
  const lessonsLocked = !isLevelLessonsCompleted(level);
  if (variantLocked || lessonsLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <Lock className="w-8 h-8 text-[var(--ivory-muted)]" aria-hidden="true" />
        <p className="text-sm text-[var(--ivory-dim)] max-w-md">
          {variantLocked
            ? t('academy.levelCertification.variantLocked', {
                variant: activeVariant,
                defaultValue: '认证测验仅在标准变体提供（当前变体：{{variant}}）',
              })
            : t('academy.levelCertification.notCompletedLocked', {
                completed: levelCompletion.completed,
                total: levelCompletion.total,
                defaultValue: '需完成本级别全部课程才能参加认证（当前进度：{{completed}}/{{total}}）',
              })}
        </p>
        <button
          onClick={() => navigate('/academy')}
          className="text-sm text-[var(--brass-bright)] hover:underline"
        >
          {t(BACK_TO_ACADEMY)}
        </button>
      </div>
    );
  }

  if (loadedLessons === null || !contentReady) {
    return (
      <div className="py-6">
        <PageSkeleton />
      </div>
    );
  }

  const requiredAccuracy = REQUIRED_ACCURACY;
  const question = allQuestions[currentIndex];

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
    if (question && index === question.correctIndex) {
      setCorrectCount((count) => count + 1);
    }
  };

  const finishExam = () => {
    const score = Math.round((correctCount / allQuestions.length) * 100);
    const result = submitCertificationAttempt(level, {
      score,
      totalQuestions: allQuestions.length,
      questionIds: allQuestions.map((item) => item.id),
      poolSize: getCertificationPoolSize(level, mergedLessons),
    });
    setOutcome({ score, result });
  };

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
      return;
    }
    finishExam();
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    setCorrectCount(0);
    setOutcome(null);
    setSessionSeed(Math.floor(Math.random() * 2 ** 31));
  };

  if (outcome) {
    return (
      <CertificationResultView
        level={level}
        score={outcome.score}
        correctCount={correctCount}
        total={allQuestions.length}
        requiredAccuracy={requiredAccuracy}
        result={outcome.result}
        anchors={getLevelTheoryAnchors(level, 3)}
        canRetry={certState.status === 'available'}
        now={now}
        onRetry={handleRestart}
        onBack={() => navigate('/academy')}
        onOpenAnchor={(anchor) => navigate(`/theory/chapter/${anchor}`)}
      />
    );
  }

  if (!started) {
    return (
      <CertificationIntroView
        level={level}
        levelTitles={levelEntries.map((entry) => entry.title).join(' · ')}
        questionCount={allQuestions.length}
        poolSize={getCertificationPoolSize(level, mergedLessons)}
        requiredAccuracy={requiredAccuracy}
        attempts={certification?.attempts}
        bestScore={certification?.bestScore}
        state={certState}
        now={now}
        onStart={() => setStarted(true)}
        onBack={() => navigate('/academy')}
      />
    );
  }

  if (!question) return null;
  const isCorrect = selectedIndex === question.correctIndex;

  return (
    <div className="py-6">
      <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
        <div className="flex items-center gap-1.5 mb-6">
          {allQuestions.map((item, index) => (
            <div
              key={item.id}
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

        <p className="text-xs text-[var(--ivory-muted)] mb-2 font-numeric">
          {t('academy.quiz.progress', { current: currentIndex + 1, total: allQuestions.length })}
        </p>
        <h3 className="font-display text-[17px] text-[var(--ivory)] mb-5 leading-snug">
          {question.question}
        </h3>

        <div className="space-y-2.5">
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.correctIndex;
            return (
              <button
                key={option}
                onClick={() => handleSelect(index)}
                disabled={showExplanation}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200',
                  !showExplanation &&
                    'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/50 text-[var(--ivory-dim)]',
                  showExplanation &&
                    isCorrectOption &&
                    'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                  showExplanation &&
                    isSelected &&
                    !isCorrectOption &&
                    'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
                  showExplanation && !isSelected && !isCorrectOption && 'opacity-40',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-numeric">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                  {showExplanation && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />
                  )}
                  {showExplanation && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 ml-auto shrink-0" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-4 rounded-lg p-4 text-sm leading-relaxed',
              isCorrect
                ? 'bg-[var(--poker-success-bg)] border border-[var(--poker-success)]/30 text-[var(--poker-success)]/90'
                : 'bg-[var(--poker-danger-bg)] border border-[var(--poker-danger)]/30 text-[var(--danger-text)]/90',
            )}
          >
            <p className="font-semibold mb-1">
              {isCorrect ? t('academy.quiz.correctMark') : t('academy.quiz.wrongMark')}
            </p>
            <p>{question.explanation}</p>
          </motion.div>
        )}

        {showExplanation && (
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90"
            >
              {currentIndex < allQuestions.length - 1
                ? t('academy.quiz.next')
                : t('academy.quiz.viewResult')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

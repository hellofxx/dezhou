import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ClipboardCheck, Lock, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/button';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { useTheoryLevel } from '../hooks/useTheoryLevel';
import { useTheoryContentI18n } from '../hooks/useTheoryContentI18n';
import { findLevelSummaryById, getChapterDifficulty } from '../utils/theoryMeta';
import { resolveTheoryQuizQuestion } from '../utils/contentKeys';
import { orderTheoryQuizQuestion } from '../utils/quizOrder';
import { buildTheoryReviewItems } from '../utils/theorySrs';
import {
  buildCheckpointQuestions,
  getCheckpointAttemptNumber,
  groupWrongByChapter,
  isCheckpointUnlocked,
  isFirstCheckpointAttempt,
  scoreCheckpoint,
  summarizeCheckpointResults,
  type CheckpointDimensionStat,
} from '../utils/checkpoint';

interface TheoryCheckpointProps {
  /** Level id（'t1'–'t9'） */
  levelId: string;
  /** 退出入口（由宿主页面决定跳转 / 关闭弹层）；缺省时不渲染退出按钮 */
  onExit?: () => void;
  className?: string;
}

/**
 * 检查点 → 策略学院认证 Level 的映射（仅标准变体）。
 *
 * 只拼路由字符串，不 import 策略学院、也不读它的 store：
 * 认证页自身按「Level 已完成 / 标准变体 / 冷却 / 有效期」判定门禁，理论侧只负责把人送过去。
 * 映射依据理论支柱与认证题池的对应关系：T1/T2 落 L1，T3 落 L2，T4/T5/T7 落 L4（含 4A/4B），
 * T6 落 L3，T8 落 L5，T9 落 L6。
 */
export const CERTIFICATION_LEVEL_BY_THEORY_LEVEL: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 4,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
};

interface CheckpointResultView {
  score: number;
  correct: number;
  total: number;
  bestScore: number;
  stats: CheckpointDimensionStat[];
  wrongCount: number;
}

/**
 * Level 检查点（形成性自查）。
 *
 * 边界（PRD §5.27.8）：
 * - 门禁：仅本级**核心章全部完成**后开放（增补章不参与；不接入 debug 之外的额外旁路）；
 * - 提交只写 `recordCheckpointAttempt`（成绩 + 抽中题 id）；
 * - 首次检查点按题更新 ELO（维度取**来源章**的 eloDimension、难度取 Level），重考不再更新；
 * - 错题按来源章写入 SRS 复习队列（复习项路由回该章）；
 * - **不解锁下一级、不发证书**（结果卡显式标注），也不写 completedChapters。
 */
export function TheoryCheckpoint({ levelId, onExit, className }: TheoryCheckpointProps) {
  const { t } = useTranslation();
  const levelSummary = findLevelSummaryById(levelId);
  const level = useTheoryLevel(levelId);
  const summaryChapterIds = useMemo(
    () => levelSummary?.chapters.map((chapter) => chapter.id) ?? [],
    [levelSummary],
  );
  const contentReady = useTheoryContentI18n(summaryChapterIds);

  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const checkpoints = useTheoryStore((s) => s.progress.checkpoints);
  const recordCheckpointAttempt = useTheoryStore((s) => s.recordCheckpointAttempt);
  const updateElo = useProgressStore((s) => s.updateElo);
  const addReviewItem = useProgressStore((s) => s.addReviewItem);

  const unlocked = isCheckpointUnlocked(levelId, completedChapters);
  // 认证 CTA 只对标准变体出现（短牌/单挑本批无认证）；映射缺失时不渲染，避免拼出死链
  const certificationLevel =
    levelSummary?.variant === 'standard'
      ? CERTIFICATION_LEVEL_BY_THEORY_LEVEL[levelSummary.level]
      : undefined;
  const attemptNumber = getCheckpointAttemptNumber(checkpoints, levelId);
  const [phase, setPhase] = useState<'idle' | 'quiz' | 'result'>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<CheckpointResultView | null>(null);
  const correctFlagsRef = useRef<boolean[]>([]);

  // 抽题 → t() 解析 → 选项重排（与章末小测同一条管线）
  const questions = useMemo(() => {
    if (!level) return [];
    return buildCheckpointQuestions(level, attemptNumber).map((item) => ({
      ...item,
      question: orderTheoryQuizQuestion(resolveTheoryQuizQuestion(t, item.question)),
    }));
  }, [level, attemptNumber, t]);

  const question = questions[currentIndex];

  const resetRound = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswered(false);
    setCorrectCount(0);
    correctFlagsRef.current = [];
  };

  const start = () => {
    resetRound();
    setResult(null);
    setPhase('quiz');
  };

  const handleSelect = (index: number) => {
    if (answered || !question) return;
    const isCorrect = index === question.question.correctIndex;
    setSelectedIndex(index);
    setAnswered(true);
    correctFlagsRef.current = [...correctFlagsRef.current, isCorrect];
    if (isCorrect) setCorrectCount((count) => count + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedIndex(null);
      setAnswered(false);
      return;
    }
    if (!level) return;
    const total = questions.length;
    const flags = correctFlagsRef.current;
    const score = scoreCheckpoint(correctCount, total);
    recordCheckpointAttempt(levelId, { score, questionIds: questions.map((item) => item.question.id) });
    // 首次检查点按题更新 ELO（维度取来源章），重考不再更新
    if (isFirstCheckpointAttempt(checkpoints, levelId)) {
      questions.forEach((item, index) => {
        updateElo(item.eloDimension, flags[index] === true, getChapterDifficulty(level.level));
      });
    }
    // 错题按来源章入 SRS 队列（复习项路由回来源章）
    for (const group of groupWrongByChapter(questions, flags)) {
      const source = level.chapters.find((chapter) => chapter.id === group.chapterId);
      if (!source) continue;
      for (const item of buildTheoryReviewItems(source, group.questionIds)) addReviewItem(item);
    }
    setResult({
      score,
      correct: correctCount,
      total,
      bestScore: Math.max(checkpoints?.[levelId]?.bestScore ?? 0, score),
      stats: summarizeCheckpointResults(questions, flags),
      wrongCount: total - correctCount,
    });
    setPhase('result');
  };

  if (!levelSummary) return null;

  if (!unlocked) {
    return (
      <div className={cn('panel space-y-3 text-center py-6', className)}>
        <Lock className="mx-auto w-6 h-6 text-[var(--ivory-muted)]" aria-hidden="true" />
        <h2 className="font-display text-base text-[var(--ivory)]">{t('theory.checkpoint.title')}</h2>
        <p className="text-xs text-[var(--ivory-muted)]">{t('theory.checkpoint.lockedHint')}</p>
      </div>
    );
  }

  if (level === undefined || !contentReady) {
    return (
      <div className={cn('panel', className)}>
        <ComponentSkeleton />
      </div>
    );
  }

  if (level === null || questions.length === 0) {
    return (
      <div className={cn('panel space-y-2 text-center py-6', className)}>
        <h2 className="font-display text-base text-[var(--ivory)]">{t('theory.checkpoint.title')}</h2>
        <p className="text-xs text-[var(--ivory-muted)]">{t('theory.checkpoint.notReady')}</p>
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('panel space-y-4', className)}
      >
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
          <h2 className="font-display text-lg text-[var(--ivory)]">{t('theory.checkpoint.resultTitle')}</h2>
        </div>
        <p className="font-numeric text-3xl text-[var(--brass-bright)]">
          {t('theory.checkpoint.score', { score: result.score })}
        </p>
        <p className="text-xs font-numeric text-[var(--ivory-muted)]">
          {t('theory.checkpoint.bestScore', { score: result.bestScore })} ·{' '}
          {t('theory.chapterView.answered', { correct: result.correct, total: result.total })}
        </p>
        <div>
          <p className="text-xs font-semibold text-[var(--ivory-dim)] mb-2">
            {t('theory.checkpoint.dimensionBreakdown')}
          </p>
          <ul className="flex flex-wrap gap-2">
            {result.stats.map((stat) => (
              <li
                key={stat.dimension}
                className="rounded-sm border border-[var(--walnut-border)] bg-[var(--felt)]/40 px-2 py-1 text-[11px] text-[var(--ivory-dim)] font-numeric"
              >
                {t(`theory.checkpoint.dimension.${stat.dimension}`)} {stat.correct}/{stat.total}
              </li>
            ))}
          </ul>
        </div>
        {result.wrongCount > 0 && (
          <p className="text-xs text-[var(--ivory-muted)]">{t('theory.checkpoint.srsHint')}</p>
        )}
        <p className="rounded-lg border border-[var(--brass)]/30 bg-[var(--brass)]/10 px-3 py-2 text-xs text-[var(--ivory-dim)]">
          {t('theory.checkpoint.noCertificate')}
        </p>
        {certificationLevel !== undefined && (
          <Link
            to={`/academy/certification/${certificationLevel}`}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brass-fill)] px-4 py-2.5 text-sm font-semibold text-[var(--brass-fill-ink)] transition-opacity hover:opacity-90 ${FOCUS_RING}`}
          >
            {t('theory.checkpoint.certificationCta')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={start}
            className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
          >
            {t('theory.checkpoint.retry')}
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-sm text-[var(--ivory)] hover:opacity-90 transition-opacity ${FOCUS_RING}`}
            >
              {t('theory.chapterView.backToChapters')}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (phase === 'quiz' && question) {
    return (
      <div className={cn('panel space-y-5', className)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base text-[var(--ivory)]">{t('theory.checkpoint.title')}</h2>
          <p className="text-xs font-numeric text-[var(--ivory-muted)]">
            {t('theory.checkpoint.questionOf', { current: currentIndex + 1, total: questions.length })}
          </p>
        </div>
        <h3 className="font-display text-[17px] leading-snug text-[var(--ivory)]">
          {question.question.question}
        </h3>
        <div className="space-y-2.5">
          {question.question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === question.question.correctIndex;
            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={answered}
                className={cn(
                  'w-full min-h-11 text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200',
                  FOCUS_RING,
                  !answered &&
                    'border-[var(--walnut-border)] bg-[var(--felt)] text-[var(--ivory-dim)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40',
                  answered && isCorrectOption && 'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                  answered && isSelected && !isCorrectOption && 'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
                  answered && !isSelected && !isCorrectOption &&
                    'border-[var(--walnut-border)]/50 bg-[var(--felt)]/50 text-[var(--ivory-muted)] opacity-60',
                )}
              >
                <span className="flex items-center gap-3">
                  <span className="flex-1">{option}</span>
                  {answered && isCorrectOption && <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />}
                  {answered && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
        {answered && (
          <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)]/40 p-4 text-sm leading-relaxed text-[var(--ivory-dim)]">
            {question.question.explanation}
          </div>
        )}
        {answered && (
          <div className="flex justify-end">
            <Button variant="default" onClick={handleNext} className="min-h-11">
              {currentIndex < questions.length - 1
                ? t('theory.quiz.next')
                : t('theory.checkpoint.finish')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('panel space-y-3', className)}>
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
        <h2 className="font-display text-base text-[var(--ivory)]">{t('theory.checkpoint.title')}</h2>
      </div>
      <p className="text-xs text-[var(--ivory-muted)]">{t('theory.checkpoint.subtitle')}</p>
      {typeof checkpoints?.[levelId]?.bestScore === 'number' && (
        <p className="text-xs font-numeric text-[var(--ivory-dim)]">
          {t('theory.checkpoint.bestScore', { score: checkpoints[levelId]!.bestScore })}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default" onClick={start} className="min-h-11">
          {t('theory.checkpoint.entry')}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
        {onExit && (
          <button
            onClick={onExit}
            className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
          >
            {t('theory.chapterView.backToChapters')}
          </button>
        )}
      </div>
      <p className="text-[11px] text-[var(--ivory-muted)]">{t('theory.checkpoint.noCertificate')}</p>
    </div>
  );
}

export default TheoryCheckpoint;

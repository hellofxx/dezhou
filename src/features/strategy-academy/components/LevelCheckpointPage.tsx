import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Lock } from 'lucide-react';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { useProgressStore } from '@/features/progress/store';
import { deriveAcademyCourseFilesForLevel } from '@/i18n/academyCourse';
import { useAcademyStore } from '../store';
import { useAcademyLessonsForLevel } from '../hooks/useAcademyLessons';
import { useAcademyCourseI18n } from '../hooks/useAcademyCourseI18n';
import { getLevelSummariesByNumber } from '../utils/academyMeta';
import { getLevelCompletion } from '../utils/certificationStatus';
import { resolveQuizQuestion } from '../utils/contentKeys';
import { getLessonEloDifficulty } from '../utils/eloDifficulty';
import {
  buildCheckpointQuestions,
  getCheckpointQuestionCount,
  scoreCheckpoint,
  summarizeCheckpointResults,
  type CheckpointDimensionStat,
} from '../utils/checkpoint';
import { buildCheckpointReviewItems } from '../utils/checkpointSrs';
import { checkpointText } from '../utils/checkpointCopy';
import { CheckpointQuizView } from './CheckpointQuizView';
import { CheckpointResultView } from './CheckpointResultView';

interface CheckpointRoundResult {
  score: number;
  correct: number;
  total: number;
  isFirstAttempt: boolean;
  firstScore: number;
  bestScore: number;
  stats: CheckpointDimensionStat[];
}

/**
 * Level Checkpoint 页（形成性自查）。
 *
 * 边界（PRD §5.16.13 / P2）：
 * - 门禁：仅本级核心课**全部完成**（store `isLevelLessonsCompleted`）后开放；URL 直达不渲染题目；
 * - 12 题混合测评（题池不足时全量），题目带来源课，错题回链来源课；
 * - 首轮逐题按来源课 ELO 维度更新 ELO + `recordAnswer`；重考不更新 ELO，但错题仍进 SRS；
 * - 只写 `checkpoints[level]`：**不发证、不解锁下一级**，重考无冷却。
 */
export default function LevelCheckpointPage() {
  const { t } = useTranslation();
  const { level: levelParam } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const level = Number.parseInt(levelParam ?? '1', 10);
  const levelEntries = useMemo(() => getLevelSummariesByNumber(level), [level]);

  // 未知 Level 不加载文案文件；L7 题池含本土课（loader 已合并），额外补 local-lessons 文案
  const courseFiles = useMemo(() => {
    if (levelEntries.length === 0) return [];
    const files = deriveAcademyCourseFilesForLevel(level);
    return level === 7 ? [...files, 'local-lessons'] : files;
  }, [level, levelEntries]);
  const contentReady = useAcademyCourseI18n(courseFiles);

  const completedLessons = useAcademyStore((s) => s.progress.completedLessons);
  const checkpoints = useAcademyStore((s) => s.checkpoints);
  const isLevelLessonsCompleted = useAcademyStore((s) => s.isLevelLessonsCompleted);
  const recordCheckpointAttempt = useAcademyStore((s) => s.recordCheckpointAttempt);
  const updateElo = useProgressStore((s) => s.updateElo);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const addReviewItem = useProgressStore((s) => s.addReviewItem);

  const loadedLessons = useAcademyLessonsForLevel(levelEntries.length === 0 ? 0 : level);
  const mergedLessons = loadedLessons ?? [];

  const [phase, setPhase] = useState<'idle' | 'quiz' | 'result'>('idle');
  const [sessionSeed, setSessionSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [result, setResult] = useState<CheckpointRoundResult | null>(null);

  // 抽题前先做渲染层 i18n 解析，再按会话种子稳定抽题并重排选项（与认证同一条管线）
  const questions = useMemo(
    () =>
      buildCheckpointQuestions(
        mergedLessons.map((lesson) => ({
          ...lesson,
          quiz: lesson.quiz.map((question) => resolveQuizQuestion(t, question)),
        })),
        level,
        sessionSeed,
      ),
    [mergedLessons, level, sessionSeed, t, contentReady],
  );

  const backToAcademy = () => navigate('/academy');

  const startRound = () => {
    setSessionSeed(Math.floor(Math.random() * 2 ** 31));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswered(false);
    setCorrectFlags([]);
    setResult(null);
    setPhase('quiz');
  };

  const handleSelect = (index: number) => {
    const current = questions[currentIndex];
    if (answered || !current) return;
    setSelectedIndex(index);
    setAnswered(true);
    setCorrectFlags((flags) => [...flags, index === current.question.correctIndex]);
  };

  const finishRound = () => {
    const total = questions.length;
    const correct = correctFlags.filter(Boolean).length;
    const score = scoreCheckpoint(correct, total);
    const { isFirstAttempt } = recordCheckpointAttempt(level, {
      score,
      questionIds: questions.map((item) => item.question.id),
    });
    // 首轮才写 ELO / 情绪计数器（重考只更新成绩与复习队列）
    if (isFirstAttempt) {
      questions.forEach((item, index) => {
        const isCorrect = correctFlags[index] === true;
        updateElo(item.eloDimension, isCorrect, getLessonEloDifficulty(level));
        recordAnswer(isCorrect);
      });
    }
    // 错题按来源课入 SRS 队列（首轮与重考一致）
    for (const item of buildCheckpointReviewItems(level, questions, correctFlags)) {
      addReviewItem(item);
    }
    const record = useAcademyStore.getState().checkpoints[level];
    setResult({
      score,
      correct,
      total,
      isFirstAttempt,
      firstScore: record?.firstScore ?? score,
      bestScore: record?.bestScore ?? score,
      stats: summarizeCheckpointResults(questions, correctFlags),
    });
    setPhase('result');
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => index + 1);
      setSelectedIndex(null);
      setAnswered(false);
      return;
    }
    finishRound();
  };

  if (levelEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <p className="text-[var(--ivory-muted)]">
          {checkpointText(t, 'levelNotFound', '级别未找到')}
        </p>
        <button onClick={backToAcademy} className="text-sm text-[var(--brass-bright)] hover:underline">
          {checkpointText(t, 'backToAcademy', '返回策略学院')}
        </button>
      </div>
    );
  }

  // URL 直达门禁：本级核心课未全部完成 → 只显示锁定原因与进度，不渲染题目
  if (!isLevelLessonsCompleted(level)) {
    const completion = getLevelCompletion(level, completedLessons);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <Lock className="w-8 h-8 text-[var(--ivory-muted)]" aria-hidden="true" />
        <h2 className="font-display text-base text-[var(--ivory)]">
          {checkpointText(t, 'title', 'Level {{level}} 检查点', { level })}
        </h2>
        <p className="text-sm text-[var(--ivory-dim)] max-w-md">
          {checkpointText(
            t,
            'lockedHint',
            '需完成本级别全部课程才能开始检查点（当前进度：{{completed}}/{{total}}）',
            { completed: completion.completed, total: completion.total },
          )}
        </p>
        <button onClick={backToAcademy} className="text-sm text-[var(--brass-bright)] hover:underline">
          {checkpointText(t, 'backToAcademy', '返回策略学院')}
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

  const current = questions[currentIndex];
  const record = checkpoints[level];

  if (phase === 'result' && result) {
    return (
      <CheckpointResultView
        level={level}
        score={result.score}
        correct={result.correct}
        total={result.total}
        isFirstAttempt={result.isFirstAttempt}
        firstScore={result.firstScore}
        bestScore={result.bestScore}
        wrongCount={result.total - result.correct}
        stats={result.stats}
        onRetry={startRound}
        onBack={backToAcademy}
      />
    );
  }

  if (phase === 'quiz' && current) {
    return (
      <CheckpointQuizView
        level={level}
        question={current}
        currentIndex={currentIndex}
        total={questions.length}
        selectedIndex={selectedIndex}
        answered={answered}
        onSelect={handleSelect}
        onNext={handleNext}
      />
    );
  }

  return (
    <div className="py-6">
      <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
          <h2 className="font-display text-lg text-[var(--ivory)]">
            {checkpointText(t, 'title', 'Level {{level}} 检查点', { level })}
          </h2>
        </div>
        <p className="text-sm text-[var(--ivory-dim)]">
          {checkpointText(
            t,
            'subtitle',
            '12 题混合测评，覆盖本级别各核心课时；结果按来源课时给出各维度表现。',
          )}
        </p>
        <p className="text-xs font-numeric text-[var(--ivory-muted)]">
          {checkpointText(t, 'questionCount', '题目数量：{{count}} 题', {
            count: getCheckpointQuestionCount(mergedLessons),
          })}
          {' · '}
          {checkpointText(t, 'attempts', '历史尝试：{{count}} 次', {
            count: record?.attempts ?? 0,
          })}
          {typeof record?.bestScore === 'number' && (
            <>
              {' · '}
              {checkpointText(t, 'bestScore', '历史最佳：{{score}}%', { score: record.bestScore })}
            </>
          )}
        </p>
        <p className="rounded-lg border border-[var(--brass)]/30 bg-[var(--brass)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--ivory-dim)]">
          {checkpointText(t, 'formativeNote', '形成性自查：不发证书、不解锁下一级')}
          {' · '}
          {checkpointText(t, 'noCooldown', '可随时重考，重考不再计入 ELO')}
        </p>
        {questions.length === 0 ? (
          <p className="text-xs text-[var(--ivory-muted)]">
            {checkpointText(t, 'notReady', '本级别题库暂不可用，请稍后重试')}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={startRound}
              className={`inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 ${FOCUS_RING}`}
            >
              {checkpointText(t, 'entry', '开始检查点')}
            </button>
            <button
              onClick={backToAcademy}
              className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
            >
              {checkpointText(t, 'backToAcademy', '返回策略学院')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

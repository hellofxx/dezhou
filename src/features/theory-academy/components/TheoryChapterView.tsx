import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useProgressStore } from '@/features/progress/store';
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useTheoryStore } from '../store';
import { findChapterById, findLevelByChapterId, getNextChapter, isLevelFullyCompleted } from '../utils/theoryProgress';
import { TheorySectionRenderer } from './TheorySectionRenderer';
import { TheoryQuiz } from './TheoryQuiz';
import { PracticeBridgeCard } from './PracticeBridgeCard';
import { NextChapterNav } from './NextChapterNav';

/**
 * 理论章节页：URL 直达门禁（所属 Level 未解锁则重定向回主页）+ 讲解 + 章末小测。
 * 小测完成 → completeChapter（幂等，内部 emit 训练事件）+ recordTrainingDay。
 */
export default function TheoryChapterView() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const debugUnlocked = useDebugModeStore((s) => s.unlockAll);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const startChapter = useTheoryStore((s) => s.startChapter);
  const completeChapter = useTheoryStore((s) => s.completeChapter);
  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const quizScores = useTheoryStore((s) => s.progress.quizScores);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  // Session 止损：小测消耗每日题量预算（recordAnswer），达上限时禁止进入小测
  const sessionLimitReached = useSessionLimitReached();

  const chapter = useMemo(() => (chapterId ? findChapterById(chapterId) : undefined), [chapterId]);
  const level = useMemo(() => (chapterId ? findLevelByChapterId(chapterId) : undefined), [chapterId]);
  const [phase, setPhase] = useState<'reading' | 'quiz' | 'done'>('reading');
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  // 章节切换时在渲染期同步重置阶段状态（早于绘制），消除 useEffect 迟滞导致的
  // 「新章标题下挂着上一章得分卡」的陈旧 UI 闪现
  const [trackedChapterId, setTrackedChapterId] = useState(chapterId);
  if (chapterId !== trackedChapterId) {
    setTrackedChapterId(chapterId);
    setPhase('reading');
    setResult(null);
  }

  useEffect(() => {
    if (chapter) startChapter(chapter.id);
  }, [chapter, startChapter]);

  if (!chapter || !level) return <Navigate to="/theory" replace />;
  // URL 直达门禁（debug 解锁响应式旁路）
  if (!debugUnlocked && !isTheoryLevelUnlocked(level.id)) {
    return <Navigate to="/theory" replace />;
  }
  // 达每日题量上限时，进入小测阶段渲染止损守卫（阅读仍可进行，与其他训练模块口径一致）。
  // P1F-01（专批 B：开局判定）：useSessionLimitReached 为 mount 快照冻结，
  // 小测进行中达上限不再中途拦断丢弃作答进度，允许走完结算；新进入章节页时再拦
  if (phase === 'quiz' && sessionLimitReached) return <SessionLimitGuard />;

  const nextChapter = getNextChapter(chapter.id);
  // P1F-02：getNextChapter 跨 Level 顺延时，目标 Level 未解锁会被上方门禁静默弹回 ——
  // 渲染前校验解锁态（调试解锁旁路），未解锁降级为提示文案（NextChapterNav）
  const nextChapterLevel = nextChapter ? findLevelByChapterId(nextChapter.id) : undefined;
  const nextChapterUnlocked =
    !!nextChapterLevel && (debugUnlocked || isTheoryLevelUnlocked(nextChapterLevel.id));
  const levelCompleted = isLevelFullyCompleted(level.id, completedChapters);
  // 已完成章节回访复习：阅读页提供免重考导航（返回目录/下一章），重考取历史最高分无数据风险
  const chapterCompleted = completedChapters.includes(chapter.id);
  const bestScore = quizScores[chapter.id];

  const handleQuizComplete = (score: number, correctAnswers: number, totalQuestions: number) => {
    completeChapter(chapter.id, score, totalQuestions, correctAnswers);
    recordTrainingDay();
    setResult({ score, correct: correctAnswers, total: totalQuestions });
    setPhase('done');
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/theory')}
          aria-label="返回理论学院"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          理论学院 · {level.icon} {level.title}
        </button>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="panel">
          <p className="section-eyebrow mb-1.5">Theory {level.id.toUpperCase()} · 第 {chapter.order} 章</p>
          <h1 className="font-display text-[22px] md:text-[26px] leading-tight text-[var(--ivory)] mb-1">
            {chapter.title}
          </h1>
          <p className="text-sm text-[var(--ivory-dim)]">{chapter.subtitle}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--ivory-muted)]">
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{chapter.duration}</span>
            {chapterCompleted && (
              <span className="inline-flex items-center gap-1 text-[var(--poker-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" />已完成
              </span>
            )}
            {chapterCompleted && typeof bestScore === 'number' && (
              <span className="font-numeric text-[var(--brass-bright)]">最高 {bestScore}分</span>
            )}
          </div>
        </motion.div>

        {phase === 'reading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="panel space-y-4">
            {chapter.content.map((section, index) => (
              <TheorySectionRenderer key={index} section={section} />
            ))}
            {chapterCompleted ? (
              // 已完成章节：免重考复习导航（返回目录/下一章）+ 可选重考（幂等，取历史最高分）
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigate('/theory')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回目录
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setPhase('quiz')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors"
                  >
                    重新挑战小测
                  </button>
                  <NextChapterNav nextChapter={nextChapter} unlocked={nextChapterUnlocked} />
                </div>
              </div>
            ) : (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setPhase('quiz')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  进入章末小测
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'quiz' && (
          <div className="panel">
            <TheoryQuiz chapter={chapter} onComplete={handleQuizComplete} />
          </div>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* 小测得分摘要 */}
            {result && (
              <div className="panel text-center py-6">
                <div className="text-4xl mb-3">{result.score >= 70 ? '🎉' : '📚'}</div>
                <h2 className="font-display text-xl text-[var(--ivory)] mb-1">本章完成</h2>
                <p className="text-sm text-[var(--ivory-dim)] mb-1">
                  答对 {result.correct}/{result.total} 题
                </p>
                <p className="font-numeric text-3xl text-[var(--brass-bright)]">{result.score}分</p>
              </div>
            )}
            {/* Level 全部完成时展示实践桥接推荐 */}
            {levelCompleted && <PracticeBridgeCard recommendations={level.practiceRecommendations} />}
            <div className="panel flex items-center justify-between gap-3">
              <button
                onClick={() => navigate('/theory')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回目录
              </button>
              <NextChapterNav nextChapter={nextChapter} unlocked={nextChapterUnlocked} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

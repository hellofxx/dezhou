import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, CheckCircle2, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { transitionStandard } from '@/shared/utils/motion';
import { ProgressBar } from '@/shared/components/business/ProgressBar';
import { useProgressStore } from '@/features/progress/store';
import SessionLimitGuard, { useSessionLimitReached } from '@/shared/components/gate/SessionLimitGuard';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useTheoryStore } from '../store';
import {
  findChapterById,
  findLevelByChapterId,
  getChapterDifficulty,
  getNextChapter,
  isLevelFullyCompleted,
} from '../utils/theoryProgress';
import { TheorySectionRenderer } from './TheorySectionRenderer';
import { TheoryQuiz } from './TheoryQuiz';
import { PracticeBridgeCard } from './PracticeBridgeCard';
import { NextChapterNav } from './NextChapterNav';
import {
  resolveChapterTitle,
  resolveChapterSubtitle,
  resolveTheoryLevelTitle,
} from '../utils/titleKeys';
import { resolveTheoryObjectives, theoryContentKey } from '../utils/contentKeys';
import { buildTheoryReviewItems } from '../utils/theorySrs';

/**
 * 理论章节页：URL 直达门禁（所属 Level 未解锁则重定向回主页）+ 讲解 + 章末小测。
 * 小测完成 → completeChapter（幂等，内部 emit 训练事件）+ recordTrainingDay
 * + 章末错题写入 SRS 复习队列（theory:<questionId>）。
 */
export default function TheoryChapterView() {
  const { t } = useTranslation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const debugUnlocked = useDebugModeStore((s) => s.unlockAll);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const startChapter = useTheoryStore((s) => s.startChapter);
  const completeChapter = useTheoryStore((s) => s.completeChapter);
  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const quizScores = useTheoryStore((s) => s.progress.quizScores);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  const addReviewItem = useProgressStore((s) => s.addReviewItem);
  // Session 止损：小测消耗每日题量预算（recordAnswer），达上限时禁止进入小测
  const sessionLimitReached = useSessionLimitReached();

  const chapter = useMemo(() => (chapterId ? findChapterById(chapterId) : undefined), [chapterId]);
  const level = useMemo(() => (chapterId ? findLevelByChapterId(chapterId) : undefined), [chapterId]);
  const [phase, setPhase] = useState<'reading' | 'quiz' | 'done'>('reading');
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);
  // 重测计数：作为 TheoryQuiz 的 key 强制重挂载，重置内部作答状态（测试效应：多次提取强化长期记忆）
  const [retryCount, setRetryCount] = useState(0);
  // 章节切换时在渲染期同步重置阶段状态（早于绘制），消除 useEffect 迟滞导致的
  // 「新章标题下挂着上一章得分卡」的陈旧 UI 闪现
  const [trackedChapterId, setTrackedChapterId] = useState(chapterId);
  // 章节切换时短暂展示骨架屏，消除「旧章标题下挂新章内容」的视觉跳变
  const [isTransitioning, setIsTransitioning] = useState(false);
  // §13.3.4 / §13.7.1 移动端阅读进度条：监听滚动容器，计算阅读百分比
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readPct, setReadPct] = useState(0);
  if (chapterId !== trackedChapterId) {
    setTrackedChapterId(chapterId);
    setPhase('reading');
    setResult(null);
    setRetryCount(0);
    setIsTransitioning(true);
  }

  useEffect(() => {
    if (chapter) startChapter(chapter.id);
  }, [chapter, startChapter]);

  // 过渡骨架屏 150ms 后恢复内容区（经验值：足够覆盖一次渲染周期，避免长时间空白）
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => setIsTransitioning(false), 150);
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  // §13.3.4 阅读进度条：scrollTop/(scrollHeight-clientHeight) 百分比，passive 监听 + cleanup
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      setReadPct(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [chapter?.id]);

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

  const handleQuizComplete = (
    score: number,
    correctAnswers: number,
    totalQuestions: number,
    wrongQuestionIds: string[],
  ) => {
    completeChapter(chapter.id, score, totalQuestions, correctAnswers);
    recordTrainingDay();
    // 章末错题进 SRS 复习队列。刻意放在 completeChapter 的 alreadyCompleted 早退**之外**
    // （故记在视图层而非 store 内），重测答错同样入队；addReviewItem 按 item.id 整体 upsert，
    // 重复重测不堆积。此处不触碰 recordAnswer —— 每题作答已在 TheoryQuiz 内计数，禁止二次计数。
    buildTheoryReviewItems(chapter, wrongQuestionIds).forEach((item) => addReviewItem(item));
    setResult({ score, correct: correctAnswers, total: totalQuestions });
    setPhase('done');
  };

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      {/* §13.3.4 移动端阅读进度条（fixed top，仅 <768px 显示） */}
      <div className="reading-progress-bar" style={{ width: `${readPct}%` }} />
      {/* 全宽布局：外层 main 已提供 p-4 md:p-6 + G1 全局限宽；正文区单独 max-w-3xl（T-T1） */}
      <div className="py-6 space-y-5">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/theory')}
          aria-label={t('theory.chapterView.backAria')}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('theory.title')} · {level.icon} {resolveTheoryLevelTitle(t, level)}
        </button>

        {isTransitioning ? (
          <div className="panel">
            <ComponentSkeleton />
          </div>
        ) : (
          <>
        {/* Header（页内流式，无 panel 外框 —— 与 strategy-academy CourseView 完全一致）。
    T-T6 撤销 T-T1 给 header 加的 panel 外框：策略学院 header 在 main 流内贴左起步
    （返回按钮 + pill + 进度条 + 标题 + 元数据均无外框包住）。理论学院同样改为流式布局。 */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionStandard}
          className="mb-6"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)]">
              {level.icon} T{level.level} · {resolveTheoryLevelTitle(t, level)}
            </span>
            <span className="font-numeric text-xs text-[var(--ivory-muted)]">
              {t('theory.chapterView.chapterOf', { current: chapter.order, total: level.chapters.length })}
            </span>
            <div className="flex-1 min-w-[160px]">
              <ProgressBar
                value={
                  level.chapters.length > 0
                    ? Math.round(
                        (level.chapters.filter((c) => completedChapters.includes(c.id)).length /
                          level.chapters.length) *
                          100
                      )
                    : 0
                }
                size="sm"
              />
            </div>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[22px] md:text-[26px] leading-tight text-[var(--ivory)] mb-1">
                {resolveChapterTitle(t, chapter)}
              </h1>
              <p className="text-sm text-[var(--ivory-dim)]">{resolveChapterSubtitle(t, chapter)}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--ivory-muted)] shrink-0 pt-1">
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{chapter.duration}</span>
              {(() => {
                const diff = getChapterDifficulty(chapter.level);
                return (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide',
                    diff < 0.35
                      ? 'bg-[var(--poker-success-bg)] text-[var(--poker-success)]'
                      : diff < 0.6
                        ? 'bg-[var(--poker-warning-bg)] text-[var(--poker-warning)]'
                        : 'bg-[var(--poker-danger-bg)] text-[var(--poker-danger)]'
                  )}>
                    {diff < 0.35 ? t('theory.difficultyBasic') : diff < 0.6 ? t('theory.difficultyMid') : t('theory.difficultyAdvanced')}
                  </span>
                );
              })()}
              {chapterCompleted && (
                <span className="inline-flex items-center gap-1 text-[var(--poker-success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />{t('theory.chapterView.completed')}
                </span>
              )}
              {chapterCompleted && typeof bestScore === 'number' && (
                <span className="font-numeric text-[var(--brass-bright)]">{t('theory.chapterView.bestScore', { score: bestScore })}</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* 学习目标卡片（先行组织者策略）：章节 objectives 非空时渲染。
            与下方阅读区正文容器**同宽居中对齐**（max-w-3xl mx-auto）——
            先行组织者卡与正文构成统一的阅读列，与 strategy-academy 正文列一致。 */}
        {chapter.objectives && chapter.objectives.length > 0 && (
          <div className="panel border-[var(--poker-frost)]/40 bg-[var(--poker-frost-bg)] max-w-3xl mx-auto">
            <h2 className="text-sm font-semibold text-[var(--poker-frost)] mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 shrink-0" />
              {t('theory.objectives')}
            </h2>
            <ul className="space-y-1">
              {resolveTheoryObjectives(t, chapter.id, chapter.objectives).map((obj, i) => (
                <li key={i} className="text-sm text-[var(--ivory-dim)] leading-relaxed flex items-start gap-2">
                  <span className="text-[var(--poker-frost)] mt-0.5 shrink-0">•</span>
                  {obj}
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === 'reading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 max-w-3xl mx-auto"
          >
            {/* 正文容器与 strategy-academy CourseView 完全一致（居中 max-w-3xl walnut-panel），
                两学院课程文字展示的居中与容器大小统一 */}
            <div className="space-y-6">
              {chapter.content.map((section, index) => (
                <TheorySectionRenderer
                  key={index}
                  section={section}
                  contentKey={theoryContentKey(chapter.id, index)}
                  chapterOrder={chapter.order}
                  sectionIndex={index}
                />
              ))}
            </div>
            {chapterCompleted ? (
              // 已完成章节：免重考复习导航（返回目录/下一章）+ 可选重考（幂等，取历史最高分）
              // 三按钮(返回目录 / 重考小测 / 下一章)窄屏纵向堆叠，桌面端左/右双簇对齐
              <div className="pt-4 mt-2 border-t border-[var(--walnut-border)]/50 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                  onClick={() => navigate('/theory')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('theory.chapterView.backToChapters')}
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setPhase('quiz')}
                    className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                  >
                    {t('theory.chapterView.retryQuiz')}
                  </button>
                  <NextChapterNav nextChapter={nextChapter} unlocked={nextChapterUnlocked} />
                </div>
              </div>
            ) : (
              <div className="pt-4 mt-2 border-t border-[var(--walnut-border)]/50 flex justify-end">
                <button
                  onClick={() => setPhase('quiz')}
                  className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  {t('theory.chapterView.startQuiz')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'quiz' && (
          <div className="panel">
            <TheoryQuiz key={retryCount} chapter={chapter} onComplete={handleQuizComplete} />
          </div>
        )}

        {phase === 'done' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* 小测得分摘要 */}
            {result && (
              <div className="panel text-center py-6">
                <div className="text-4xl mb-3">{result.score >= 70 ? '🎉' : '📚'}</div>
                <h2 className="font-display text-xl text-[var(--ivory)] mb-1">{t('theory.chapterView.chapterDone')}</h2>
                <p className="text-sm text-[var(--ivory-dim)] mb-1">
                  {t('theory.chapterView.answered', { correct: result.correct, total: result.total })}
                </p>
                <p className="font-numeric text-3xl text-[var(--brass-bright)]">{t('theory.chapterView.score', { score: result.score })}</p>
              </div>
            )}
            {/* Level 全部完成时展示实践桥接推荐 */}
            {levelCompleted && <PracticeBridgeCard recommendations={level.practiceRecommendations} />}
            <div className="panel flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <button
                onClick={() => navigate('/theory')}
                className="inline-flex min-h-11 items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('theory.chapterView.backToChapters')}
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setRetryCount((c) => c + 1);
                    setPhase('quiz');
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  {t('theory.retryQuiz')}
                </button>
                <NextChapterNav nextChapter={nextChapter} unlocked={nextChapterUnlocked} />
              </div>
            </div>
          </motion.div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

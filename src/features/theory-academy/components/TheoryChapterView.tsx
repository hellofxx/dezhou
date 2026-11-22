import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ComponentSkeleton, PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { AcademyPeek, AcademyReadingPlane } from '@/shared/components/academy';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { progressCommands } from '@/features/progress/api';
import { SessionLimitGuard, useSessionLimitReached } from '@/features/progress/sessionLimit';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useTheoryStore } from '../store';
import { useTheoryContentI18n } from '../hooks/useTheoryContentI18n';
import { useTheoryLevel } from '../hooks/useTheoryLevel';
import {
  findChapterSummaryById,
  findLevelSummaryByChapterId,
  getNextChapterSummary,
  isLevelFullyCompleted,
} from '../utils/theoryMeta';
import { TheoryChapterHeader } from './TheoryChapterHeader';
import { TheoryChapterRail } from './TheoryChapterRail';
import { TheoryChapterBody } from './TheoryChapterBody';
import { TheoryChapterDone } from './TheoryChapterDone';
import { TheoryQuiz } from './TheoryQuiz';
import { TheoryQuizPeek } from './TheoryQuizPeek';
import { TheoryNotesPanel } from './TheoryNotesPanel';
import { ContentIssueReport } from './ContentIssueReport';
import { getChapterLastReviewed } from './theoryOptionalSources';
import { resolveTheoryLevelTitle } from '../utils/titleKeys';
import { buildTheoryReviewItems } from '../utils/theorySrs';

/**
 * 理论章节页：URL 直达门禁（所属 Level 未解锁则重定向回主页）+ 讲解 + 章末小测。
 * 小测完成 → recordChapterAttempt（首次才 emit 训练事件）+ recordTrainingDay
 * + 章末错题写入 SRS 复习队列（theory:<questionId>）。
 * 本视图只保留 phase 状态机与门禁接线；阅读正文（渐进披露 / 要点卡 / CalcDrill / CTA）
 * 装配在 TheoryChapterBody，完成态装配在 TheoryChapterDone。
 * quiz 阶段在小测之上提供原文 peek（AcademyPeek + TheoryQuizPeek），答错可经
 * TheoryQuiz 的 onReview 回到阅读态（弃本次作答进度，peek 补偿保进度对照）。
 */
export default function TheoryChapterView() {
  const { t } = useTranslation();
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const debugUnlocked = useDebugModeStore((s) => s.unlockAll);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const startChapter = useTheoryStore((s) => s.startChapter);
  const recordChapterAttempt = useTheoryStore((s) => s.recordChapterAttempt);
  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const quizScores = useTheoryStore((s) => s.progress.quizScores);
  const bookmarkedChapters = useTheoryStore((s) => s.progress.bookmarkedChapters ?? []);
  const toggleBookmark = useTheoryStore((s) => s.toggleBookmark);
  const chapterAttempts = useTheoryStore((s) => s.progress.chapterAttempts);
  const hasPlacement = useTheoryStore((s) => s.progress.placement !== undefined);
  // Session 止损：小测消耗每日题量预算（recordAnswer），达上限时禁止进入小测
  const sessionLimitReached = useSessionLimitReached();

  // 目录摘要先到（门禁/标题可用），完整正文只加载当前 Level
  const chapterSummary = chapterId ? findChapterSummaryById(chapterId) : undefined;
  const levelSummary = chapterId ? findLevelSummaryByChapterId(chapterId) : undefined;
  const level = useTheoryLevel(levelSummary?.id);
  const chapter = level?.chapters.find((item) => item.id === chapterId);
  // en 下先确保本 level 内容包就绪，再渲染正文/小测（zh 数据层原文即可用）
  const contentReady = useTheoryContentI18n(chapterId ? [chapterId] : []);
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

  if (!chapterSummary || !levelSummary) return <Navigate to="/theory" replace />;
  // URL 直达门禁（debug 解锁响应式旁路）：摘要层即可判定，无需等完整数据
  if (!debugUnlocked && !isTheoryLevelUnlocked(levelSummary.id)) {
    return <Navigate to="/theory" replace />;
  }
  // 完整数据加载中：保持页面骨架，避免把「加载中」误判为章节不存在而弹回目录
  if (level === undefined) {
    return (
      <div className="py-6">
        <PageSkeleton />
      </div>
    );
  }
  if (level === null || !chapter) return <Navigate to="/theory" replace />;
  // 达每日题量上限时，进入小测阶段渲染止损守卫（阅读仍可进行，与其他训练模块口径一致）。
  // P1F-01（专批 B：开局判定）：useSessionLimitReached 为 mount 快照冻结，
  // 小测进行中达上限不再中途拦断丢弃作答进度，允许走完结算；新进入章节页时再拦
  if (phase === 'quiz' && sessionLimitReached) return <SessionLimitGuard />;

  // 下一章从目录摘要跨 Level 顺延（与旧 getNextChapter 同口径，无需加载下一 Level 正文）
  const nextChapter = chapterId ? getNextChapterSummary(chapterId) : undefined;
  // P1F-02：跨 Level 顺延时，目标 Level 未解锁会被上方门禁静默弹回 ——
  // 渲染前校验解锁态（调试解锁旁路），未解锁降级为提示文案（NextChapterNav）
  const nextChapterLevel = nextChapter
    ? findLevelSummaryByChapterId(nextChapter.id)
    : undefined;
  const nextChapterUnlocked =
    !!nextChapterLevel && (debugUnlocked || isTheoryLevelUnlocked(nextChapterLevel.id));
  const levelCompleted = isLevelFullyCompleted(level.id, completedChapters);
  // 已完成章节回访复习：阅读页提供免重考导航（返回目录/下一章），重考取历史最高分无数据风险
  const chapterCompleted = completedChapters.includes(chapter.id);
  const bestScore = quizScores[chapter.id];
  const attempt = chapterAttempts?.[chapter.id];
  const lastReviewed = getChapterLastReviewed(chapter.id);

  const handleQuizComplete = (
    score: number,
    correctAnswers: number,
    totalQuestions: number,
    wrongQuestionIds: string[],
  ) => {
    recordChapterAttempt(chapter.id, score, totalQuestions, correctAnswers);
    progressCommands.recordTrainingDay();
    // 章末错题进 SRS 复习队列。刻意放在 recordChapterAttempt 的首次判定**之外**
    // （故记在视图层而非 store 内），重测答错同样入队；addReviewItem 按 item.id 整体 upsert，
    // 重复重测不堆积。此处不触碰 recordAnswer —— 每题作答已在 TheoryQuiz 内计数，禁止二次计数。
    buildTheoryReviewItems(chapter, wrongQuestionIds).forEach((item) => progressCommands.addReviewItem(item));
    setResult({ score, correct: correctAnswers, total: totalQuestions });
    setPhase('done');
  };

  return (
    <div ref={scrollRef} className="h-full overflow-auto">
      {/* §13.3.4 移动端阅读进度条（fixed top，仅 <768px 显示） */}
      <div className="reading-progress-bar" style={{ width: `${readPct}%` }} />
      {/* 阅读页双栏：主阅读列 768（<xl 居中单栏）+ xl 学习导轨（本级章节目录）；
          外层 main 已提供 p-4 md:p-6 + G1 全局限宽 */}
      <div className="py-6">
        <AcademyReadingPlane
          railLabel={t('theory.chapterView.railTitle')}
          contentClassName="space-y-5"
          rail={
            <TheoryChapterRail
              level={level}
              currentChapterId={chapter.id}
              completedChapters={completedChapters}
            />
          }
        >
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/theory')}
          aria-label={t('theory.chapterView.backAria')}
          className={`inline-flex min-h-11 items-center gap-1.5 px-2 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors ${FOCUS_RING}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('theory.title')} · {level.icon} {resolveTheoryLevelTitle(t, level)}
        </button>

        {isTransitioning || !contentReady ? (
          <div className="panel">
            <ComponentSkeleton />
          </div>
        ) : (
          <>
        <TheoryChapterHeader
          chapter={chapter}
          level={level}
          completedChapters={completedChapters}
          chapterCompleted={chapterCompleted}
          bestScore={bestScore}
          bookmarked={bookmarkedChapters.includes(chapter.id)}
          onToggleBookmark={() => toggleBookmark(chapter.id)}
          {...(lastReviewed ? { lastReviewed } : {})}
          reportSlot={<ContentIssueReport chapterId={chapter.id} />}
        />

        {phase === 'reading' ? (
          <TheoryChapterBody
            chapter={chapter}
            attempt={attempt}
            chapterCompleted={chapterCompleted}
            nextChapter={nextChapter}
            nextChapterUnlocked={nextChapterUnlocked}
            onStartQuiz={() => setPhase('quiz')}
            onBackToChapters={() => navigate('/theory')}
          />
        ) : null}

        {/* 阅读辅助：章节笔记（key 绑定章节，切换时草稿重置） + 检查点/定位入口 */}
        {phase === 'reading' ? (
          <div className="max-w-3xl mx-auto space-y-3">
            <TheoryNotesPanel key={chapter.id} chapterId={chapter.id} />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs">
              {levelCompleted ? (
                <Link
                  to={`/theory/checkpoint/${level.id}`}
                  className={`inline-flex min-h-11 items-center gap-1.5 text-[var(--poker-info)] hover:underline rounded ${FOCUS_RING}`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('theory.level.checkpointEntry')}
                </Link>
              ) : null}
              {!hasPlacement ? (
                <Link
                  to="/theory/placement"
                  className={`inline-flex min-h-11 items-center gap-1.5 text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:underline rounded ${FOCUS_RING}`}
                >
                  <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('theory.placement.title')}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {phase === 'quiz' ? (
          <div className="panel space-y-4">
            {/* 原文 peek 在小测之上（常驻折叠壳）：答题时可对照概念，不离开作答态 */}
            <AcademyPeek label={t('theory.quiz.peek')}>
              <TheoryQuizPeek chapter={chapter} />
            </AcademyPeek>
            <TheoryQuiz
              key={retryCount}
              chapter={chapter}
              onComplete={handleQuizComplete}
              onReview={() => setPhase('reading')}
            />
          </div>
        ) : null}

{phase === 'done' ? (
          <TheoryChapterDone
            result={result}
            chapter={chapter}
            level={level}
            levelCompleted={levelCompleted}
            nextChapter={nextChapter}
            nextChapterUnlocked={nextChapterUnlocked}
            onRetry={() => {
              setRetryCount((c) => c + 1);
              setPhase('quiz');
            }}
            onBackToChapters={() => navigate('/theory')}
          />
        ) : null}
          </>
        )}
        </AcademyReadingPlane>
      </div>
    </div>
  );
}
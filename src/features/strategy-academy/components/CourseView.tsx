import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, HelpCircle, ArrowRight, CheckCircle2, Home, Zap, Lock } from 'lucide-react';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import { findLessonById, getNextLesson, getAllLessons } from '../utils/courseProgress';
import { LEVELS } from '../data/courses';
import { LOCAL_LESSONS } from '../data/localLessons';
import { LOCAL_TRACK } from '../data/localTrack';
import { LEARNING_TRACKS } from '../data/learningTracks';
import { LessonContent } from './LessonContent';
import { LessonQuiz } from './LessonQuiz';
import { ProgressBar } from './ProgressBar';
import { DrillLessonRouter } from './drills/DrillLessonRouter';
import type { DrillResult } from './drills/types';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useProgressStore, createReviewItem, toLocalDateString } from '@/features/progress';
import type { PracticeResult } from '../types';

type Phase = 'reading' | 'quiz' | 'done';

// P1 修复（审计 2.1）：本土课 ID 集合，门禁按 LOCAL_TRACK 前置口径单独判定
const LOCAL_LESSON_IDS = new Set(LOCAL_LESSONS.map((l) => l.id));

export default function CourseView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { startLesson, completeLesson, recordQuizScore } = useAcademy();
  const recordPracticeScore = useAcademyStore((s) => s.recordPracticeScore);
  const recordAttemptScore = useAcademyStore((s) => s.recordAttemptScore);
  const [phase, setPhase] = useState<Phase>('reading');
  const [quizScore, setQuizScore] = useState(0);
  const [drillResult, setDrillResult] = useState<DrillResult | null>(null);

  const lesson = lessonId ? findLessonById(lessonId) : undefined;
  const allLessons = getAllLessons();
  const lessonIndex = lesson ? allLessons.findIndex((l) => l.id === lesson.id) : -1;
  const progressPercent = allLessons.length > 0 ? ((lessonIndex + 1) / allLessons.length) * 100 : 0;
  const isDrill = lesson?.type === 'drill';

  // P4 修复（4.1-P1-1）+ 审计 1.1/2.1：按 lesson 所属 LevelInfo 条目判门禁，防止通过 URL 绕过；
  // 同时消除 l4a/l4b 同为 level:4 导致的 4B 解锁旁路。
  // 注：mental-tilt-recognition 是 DownswingAlert 的目标课程，允许在未解锁时访问
  const isLevelUnlocked = useAcademyStore((s) => s.isLevelUnlocked);
  const isLevelEntryUnlocked = useAcademyStore((s) => s.isLevelEntryUnlocked);
  const completedLessons = useAcademyStore((s) => s.progress.completedLessons);
  // 调试解锁：解除本土课与课程级门禁（URL 直达）
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);

  // lesson 所属的 LevelInfo 条目（本土课已并入 l7，但门禁下方单独处理）
  const levelEntry = lesson
    ? LEVELS.find((l) => l.lessons.some((x) => x.id === lesson.id))
    : undefined;
  const isLocalLesson = !!lesson && LOCAL_LESSON_IDS.has(lesson.id);

  // 本土课门禁：按 LOCAL_TRACK 前置（l1-l3 全部完成）放行，不继承 l7 的 l3+l5 硬门禁
  const isEntryCompleted = (levelId: string): boolean => {
    const entry = LEVELS.find((l) => l.id === levelId);
    return !!entry && entry.lessons.every((x) => completedLessons.includes(x.id));
  };
  const localPrereqIds = LOCAL_TRACK.prerequisiteLevelIds ?? [];
  const isLessonLevelUnlocked = !lesson
    ? true
    : debugUnlock
      ? true
      : isLocalLesson
        ? localPrereqIds.every(isEntryCompleted)
        : levelEntry?.id
          ? isLevelEntryUnlocked(levelEntry.id)
          : isLevelUnlocked(lesson.level);

  // P4 修复（4.1-P2-1）：检查细粒度 prerequisite（如果课程声明了 prerequisites 字段）
  const isPrerequisiteMet = debugUnlock
    ? true
    : lesson?.prerequisites?.every((id) => completedLessons.includes(id)) ?? true;

  const isLocked = lesson
    && lesson.id !== 'mental-tilt-recognition'
    && (!isLessonLevelUnlocked || !isPrerequisiteMet);

  useEffect(() => {
    if (lessonId) startLesson(lessonId);
  }, [lessonId, startLesson]);

  const handleStartQuiz = useCallback(() => setPhase('quiz'), []);

  const handlePracticeComplete = useCallback(
    (result: PracticeResult) => {
      recordPracticeScore(result);
    },
    [recordPracticeScore]
  );

  // P0-3.9: Drill 完成回调 — 直接进入 done 阶段，跳过 quiz
  const handleDrillComplete = useCallback(
    (result: DrillResult) => {
      setDrillResult(result);
      if (lessonId) {
        // 用 drill 结果换算成 0-100 分记录到 quizScores
        const score = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
        setQuizScore(score);
        recordQuizScore(lessonId, score);
        recordAttemptScore(lessonId, score);
        completeLesson(lessonId);
        trainingEvents.emit({
          id: `academy-${lessonId}-${Date.now()}`,
          module: 'strategy-academy',
          mode: 'drill',
          result: {
            sessionId: `academy-${lessonId}`,
            module: 'strategy-academy',
            totalQuestions: result.total,
            correctAnswers: result.correct,
            accuracy: result.total > 0 ? result.correct / result.total : 0,
            averageTime: result.timeTaken / 1000 / Math.max(result.total, 1),
            timestamp: Date.now(),
            details: [],
          },
          createdAt: Date.now(),
        });

        if (lesson) {
          const reviewItem = createReviewItem(lesson.id, lesson.title, 'strategy');
          if (score >= 90) {
            reviewItem.interval = 3;
            const date = new Date();
            date.setDate(date.getDate() + 3);
            // P0B-03：本地时区格式化（禁用 toISOString，UTC 口径在 UTC+8 凌晨会晚一天）
            reviewItem.nextReviewDate = toLocalDateString(date);
          }
          useProgressStore.getState().addReviewItem(reviewItem);
        }

        // P1E-07（专批 B）：训练日 streak 口径统一 — Drill 完成是实质训练，
        // 与 theory/其他训练模块一致计入训练日（recordTrainingDay 幂等，同日重复安全）
        useProgressStore.getState().recordTrainingDay();
      }
      setPhase('done');
    },
    [lessonId, recordQuizScore, recordAttemptScore, completeLesson, lesson]
  );

  const handleDrillExit = useCallback(() => {
    navigate('/academy');
  }, [navigate]);

  const handleQuizComplete = useCallback(
    (score: number) => {
      setQuizScore(score);
      if (lessonId) {
        recordQuizScore(lessonId, score);
        recordAttemptScore(lessonId, score);
        completeLesson(lessonId);
        trainingEvents.emit({
          id: `academy-${lessonId}-${Date.now()}`,
          module: 'strategy-academy',
          mode: 'quiz',
          result: {
            sessionId: `academy-${lessonId}`,
            module: 'strategy-academy',
            totalQuestions: lesson?.quiz.length ?? 0,
            correctAnswers: Math.round((score / 100) * (lesson?.quiz.length ?? 0)),
            accuracy: score / 100,
            averageTime: 0,
            timestamp: Date.now(),
            details: [],
          },
          createdAt: Date.now(),
        });

        // 课程完成后添加到复习队列
        if (lesson) {
          const reviewItem = createReviewItem(lesson.id, lesson.title, 'strategy');
          // 根据分数调整首次复习时间
          if (score >= 90) {
            reviewItem.interval = 3;
            const date = new Date();
            date.setDate(date.getDate() + 3);
            // P0B-03：本地时区格式化（禁用 toISOString，UTC 口径在 UTC+8 凌晨会晚一天）
            reviewItem.nextReviewDate = toLocalDateString(date);
          }
          useProgressStore.getState().addReviewItem(reviewItem);
        }

        // P1E-07（专批 B）：训练日 streak 口径统一 — 课程测验完成是实质训练，
        // 与 theory/其他训练模块一致计入训练日（recordTrainingDay 幂等，同日重复安全）
        useProgressStore.getState().recordTrainingDay();
      }
      setPhase('done');
    },
    [lessonId, recordQuizScore, recordAttemptScore, completeLesson, lesson]
  );

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--ivory-muted)]">课程未找到</p>
        <button
          onClick={() => navigate('/academy')}
          className="text-sm text-[var(--brass-bright)] hover:underline"
        >
          返回学院
        </button>
      </div>
    );
  }

  // P4 修复（4.1-P1-1 + 4.1-P2-1）+ 审计 1.1：未解锁的课程显示锁定提示（按所属条目取前置）
  if (isLocked) {
    const levelLocked = !isLessonLevelUnlocked;
    // 本土课显示 LOCAL_TRACK 前置；其余按所属 LevelInfo 条目的 prerequisiteLevelIds
    const prereqIds = isLocalLesson ? localPrereqIds : (levelEntry?.prerequisiteLevelIds ?? []);
    const prereqTitles = prereqIds
      .map((id) => LEVELS.find((l) => l.id === id)?.title)
      .filter(Boolean);
    // 无显式前置时回退到前一个条目标题（如 l4b → “进阶思维·范围与EV”）
    const entryIdx = levelEntry ? LEVELS.indexOf(levelEntry) : -1;
    const fallbackTitle = entryIdx > 0 ? LEVELS[entryIdx - 1]?.title : undefined;
    const requiredLevelText = prereqTitles.length > 0
      ? prereqTitles.join('、')
      : (fallbackTitle ?? `Level ${(lesson?.level ?? 1) - 1}`);
    const missingPrereqs = lesson?.prerequisites?.filter((id) => !completedLessons.includes(id)) ?? [];

    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12">
        <Lock className="w-10 h-10 text-[var(--ivory-muted)]" />
        <div className="text-center space-y-2">
          <p className="text-[var(--ivory)] font-display text-lg">该课程尚未解锁</p>
          {levelLocked && (
            <p className="text-sm text-[var(--ivory-muted)]">
              请先完成 {requiredLevelText} 的所有课程，再来学习本课程。
            </p>
          )}
          {!levelLocked && missingPrereqs.length > 0 && (
            <p className="text-sm text-[var(--ivory-muted)]">
              请先完成前置课程：{missingPrereqs.join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/academy')}
          className="px-5 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          返回学院
        </button>
      </div>
    );
  }

  const nextLesson = getNextLesson(lesson.id);

  // 查找当前课程所属路径的关联路径（用于完成页推荐）
  const currentTrack = LEARNING_TRACKS.find((t) => t.lessonIds.includes(lesson.id));
  const relatedTracks = currentTrack?.relatedTrackIds
    ?.map((id) => LEARNING_TRACKS.find((t) => t.id === id))
    .filter(Boolean) ?? [];

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/academy')}
          className="flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          返回学院
        </button>
        <ProgressBar value={progressPercent} size="sm" className="mb-4" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[22px] text-[var(--ivory)] leading-tight">
              {lesson.title}
            </h1>
            <p className="text-sm text-[var(--ivory-muted)] mt-1">{lesson.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--ivory-muted)] shrink-0 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {lesson.duration}
            </span>
            {isDrill ? (
              <span className="flex items-center gap-1 text-[var(--brass-bright)]">
                <Zap className="w-3.5 h-3.5" />
                Drill
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                {lesson.quiz.length} 题
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {phase === 'reading' && isDrill && (
          <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
            <DrillLessonRouter
              lesson={lesson}
              onComplete={handleDrillComplete}
              onExit={handleDrillExit}
            />
          </div>
        )}

        {phase === 'reading' && !isDrill && (
          <div>
            <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
              <LessonContent
                lesson={lesson}
                onComplete={handleStartQuiz}
                onPracticeComplete={handlePracticeComplete}
              />
            </div>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
            <h2 className="font-display text-[17px] text-[var(--ivory)] mb-5">课后测验</h2>
            <LessonQuiz
              questions={lesson.quiz}
              onComplete={handleQuizComplete}
            />
          </div>
        )}

        {phase === 'done' && (
          <>
          <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-[var(--success)] mx-auto mb-4" />
            <h2 className="font-display text-2xl text-[var(--ivory)] mb-2">
              {isDrill ? '训练完成！' : '课程完成！'}
            </h2>
            {isDrill && drillResult ? (
              <>
                <p className="text-[var(--ivory-dim)] mb-1">训练成绩</p>
                <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-2">
                  {drillResult.correct}/{drillResult.total}
                </p>
                <p className="text-xs text-[var(--ivory-muted)] mb-8">
                  正确率 {quizScore}% · 用时 {(drillResult.timeTaken / 1000).toFixed(1)}s
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--ivory-dim)] mb-1">测验得分</p>
                <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-8">{quizScore}分</p>
              </>
            )}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/academy')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80 transition-colors text-sm"
              >
                <Home className="w-4 h-4" />
                返回学院
              </button>
              {nextLesson && (
                <button
                  onClick={() => {
                    setPhase('reading');
                    setQuizScore(0);
                    setDrillResult(null);
                    navigate(`/academy/lesson/${nextLesson.id}`);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  下一课：{nextLesson.title}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 推荐下一步：关联路径卡片 */}
          {relatedTracks.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-base text-[var(--ivory)] mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-[var(--brass-bright)]" />
                推荐下一步
              </h3>
              <div className="grid gap-3">
                {relatedTracks.map((track) => (
                  <button
                    key={track!.id}
                    // P1E-01: 跳转到学习轨道页并携带 ?track= 参数（由 LearningTracksView 消费：滚动+高亮目标轨道）
                    onClick={() => navigate(`/academy/tracks?track=${track!.id}`)}
                    className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4 text-left hover:border-[var(--brass-bright)]/50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{track!.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors">
                          {track!.name}
                        </p>
                        <p className="text-xs text-[var(--ivory-muted)] mt-1 line-clamp-2">
                          {track!.description}
                        </p>
                        <p className="text-xs text-[var(--ivory-dim)] mt-2">
                          {track!.lessonIds.length} 节课 · {track!.estimatedDuration}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] transition-colors shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, HelpCircle, Zap } from 'lucide-react';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import { findLessonById, getNextLesson, getAllLessons } from '../utils/courseProgress';
import { completeCourse } from '../utils/completeCourse';
import { LEVELS } from '../data/courses';
import { LOCAL_LESSONS } from '../data/localLessons';
import { LOCAL_TRACK } from '../data/localTrack';
import { LEARNING_TRACKS } from '../data/learningTracks';
import { LessonContent } from './LessonContent';
import { LessonQuiz } from './LessonQuiz';
import { ProgressBar } from './ProgressBar';
import { CourseLockedView } from './CourseLockedView';
import { DrillLessonRouter } from './drills/DrillLessonRouter';
import CourseDoneView from './CourseDoneView';
import type { DrillResult } from './drills/types';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import type { PracticeResult, LearningTrack } from '../types';

type Phase = 'reading' | 'quiz' | 'done';

// P1 修复（审计 2.1）：本土课 ID 集合，门禁按 LOCAL_TRACK 前置口径单独判定
const LOCAL_LESSON_IDS = new Set(LOCAL_LESSONS.map((l) => l.id));

export default function CourseView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { startLesson } = useAcademy();
  const recordPracticeScore = useAcademyStore((s) => s.recordPracticeScore);
  const [phase, setPhase] = useState<Phase>('reading');
  const [quizScore, setQuizScore] = useState(0);
  const [drillResult, setDrillResult] = useState<DrillResult | null>(null);
  // P3: 重开目标（restart('practice') 时让重挂载的 LessonContent 直达实战视图）
  const [restartTarget, setRestartTarget] = useState<'units' | 'practice'>('units');

  const lesson = lessonId ? findLessonById(lessonId) : undefined;
  const allLessons = getAllLessons();
  const lessonIndex = lesson ? allLessons.findIndex((l) => l.id === lesson.id) : -1;
  const progressPercent = allLessons.length > 0 ? ((lessonIndex + 1) / allLessons.length) * 100 : 0;
  const isDrill = lesson?.type === 'drill';

  // P4 修复（4.1-P1-1）+ 审计 1.1/2.1：按 lesson 所属 LevelInfo 条目判门禁，防止通过 URL 绕过；
  // 同时消除 l4a/l4b 同为 level:4 导致的 4B 解锁旁路。
  // 注：local-mental-tilt-recognition 是 DownswingAlert 的目标课程，允许在未解锁时访问
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
    && lesson.id !== 'local-mental-tilt-recognition'
    && (!isLessonLevelUnlocked || !isPrerequisiteMet);

  // hash 直达小节：首次挂载/路由变化时滚动到对应单元；lessonId 切换时额外调用强制刷新
  const scrollToAnchor = useCallback((id: string) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      // 短延迟等待 DOM 挂载（Vite dev hot update 场景）+ lessonId 变化强制刷新
      const timer = setTimeout(() => scrollToAnchor(id), 50);
      return () => clearTimeout(timer);
    }
  }, [location.hash, lessonId, scrollToAnchor]);

  useEffect(() => {
    if (lessonId) startLesson(lessonId);
  }, [lessonId, startLesson]);

  // P3: 进入测验时重置重开目标，避免残留影响后续重挂载
  const handleStartQuiz = useCallback(() => {
    setRestartTarget('units');
    setPhase('quiz');
  }, []);

  const handlePracticeComplete = useCallback(
    (result: PracticeResult) => {
      recordPracticeScore(result);
    },
    [recordPracticeScore]
  );

  // P2-01: 薄封装 — 统一调用 completeCourse 辅助函数
  const handleDrillComplete = useCallback(
    (result: DrillResult) => {
      setDrillResult(result);
      const score = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
      setQuizScore(score);
      if (lessonId) {
        completeCourse({ lessonId, score, mode: 'drill', lesson, drillResult: result });
      }
      setPhase('done');
    },
    [lessonId, lesson]
  );

  const handleDrillExit = useCallback(() => {
    navigate('/academy');
  }, [navigate]);

  // P2-01: 薄封装 — 统一调用 completeCourse 辅助函数
  const handleQuizComplete = useCallback(
    (score: number) => {
      setQuizScore(score);
      if (lessonId) {
        completeCourse({ lessonId, score, mode: 'quiz', lesson });
      }
      setPhase('done');
    },
    [lessonId, lesson]
  );

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-[var(--ivory-muted)]">
          {t('academy.courseView.notFound', { defaultValue: '课程未找到' })}
        </p>
        <button
          onClick={() => navigate('/academy')}
          className="text-sm text-[var(--brass-bright)] hover:underline"
        >
          {t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
        </button>
      </div>
    );
  }

  // P4 修复（4.1-P1-1 + 4.1-P2-1）+ 审计 1.1：未解锁的课程显示锁定提示（按所属条目取前置）
  if (isLocked) {
    const levelLocked = !isLessonLevelUnlocked;
    // 本土课显示 LOCAL_TRACK 前置；其余按所属 LevelInfo 条目的 prerequisiteLevelIds
    const prereqIds = isLocalLesson ? localPrereqIds : (levelEntry?.prerequisiteLevelIds ?? []);
    const missingPrereqs = lesson?.prerequisites?.filter((id) => !completedLessons.includes(id)) ?? [];

    return (
      <CourseLockedView
        lesson={lesson}
        levelLocked={levelLocked}
        prereqLevelIds={prereqIds}
        missingPrereqLessonIds={missingPrereqs}
        completedLessons={completedLessons}
      />
    );
  }

  const nextLesson = getNextLesson(lesson.id);

  // 查找当前课程所属路径的关联路径（用于完成页推荐）
  // P2-04: 过滤排除（a）lessonIds 包含当前 lesson.id 的关联轨道；（b）用户已完成全部课程的轨道
  const currentTrack = LEARNING_TRACKS.find((t) => t.lessonIds.includes(lesson.id));
  const rawRelatedTracks = currentTrack?.relatedTrackIds
    ?.map((id) => LEARNING_TRACKS.find((t) => t.id === id))
    .filter((t): t is LearningTrack => t !== undefined) ?? [];
  const relatedTracks = rawRelatedTracks.filter((track) => {
    if (track.lessonIds.includes(lesson.id)) return false;
    const total = track.lessonIds.length;
    const completed = track.lessonIds.filter((id) => completedLessons.includes(id)).length;
    return completed < total;
  });

  // P3: 支持 target 参数 — 'practice' 时重挂载 LessonContent 直达实战（接受 drill 重开）
  const handleRestart = useCallback((target: 'units' | 'practice' = 'units') => {
    setPhase('reading');
    setQuizScore(0);
    setDrillResult(null);
    setRestartTarget(target);
    // 清理 hash 残留
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="pb-16">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/academy')}
          className="flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
        </button>
        {levelEntry ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)]">
              {levelEntry.icon} L{levelEntry.level} · {levelEntry.title}
            </span>
            <span className="font-numeric text-xs text-[var(--ivory-muted)]">
              {t('academy.courseView.lessonOf', {
                defaultValue: '第 {{current}}/{{total}} 课',
                current: levelEntry.lessons.findIndex((l) => l.id === lesson.id) + 1,
                total: levelEntry.lessons.length,
              })}
            </span>
            <div className="flex-1">
              <ProgressBar
                value={
                  levelEntry.lessons.length > 0
                    ? Math.round(
                        (levelEntry.lessons.filter(
                          (l) => completedLessons.includes(l.id) && l.order < (lesson.order ?? 0)
                        ).length /
                          levelEntry.lessons.length) *
                          100
                      )
                    : 0
                }
                size="sm"
              />
            </div>
          </div>
        ) : isLocalLesson ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)] whitespace-nowrap">
              {t('academy.courseView.localLessonBadge', { defaultValue: '本土课 · L7 扩展' })}
            </span>
            <span className="font-numeric text-xs text-[var(--ivory-muted)]">
              {lesson.order
                ? t('academy.courseView.lessonOrder', {
                    defaultValue: '第 {{order}} 课',
                    order: lesson.order,
                  })
                : ''}
            </span>
          </div>
        ) : (
          <ProgressBar value={progressPercent} size="sm" className="mb-4" />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
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
                {t('academy.courseView.quizCount', {
                  defaultValue: '{{count}} 题',
                  count: lesson.quiz.length,
                })}
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
            <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 max-w-3xl mx-auto">
              <LessonContent
                lesson={lesson}
                onComplete={handleStartQuiz}
                onPracticeComplete={handlePracticeComplete}
                initialView={restartTarget === 'practice' ? 'practice' : undefined}
              />
            </div>
          </div>
        )}

        {phase === 'quiz' && (
          <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
            <h2 className="font-display text-[17px] text-[var(--ivory)] mb-5">
              {t('academy.courseView.quizTitle', { defaultValue: '课后测验' })}
            </h2>
            <LessonQuiz
              questions={lesson.quiz}
              onComplete={handleQuizComplete}
            />
          </div>
        )}

        {phase === 'done' && (
          <CourseDoneView
            isDrill={isDrill}
            quizScore={quizScore}
            drillResult={drillResult}
            nextLesson={nextLesson}
            relatedTracks={relatedTracks}
            completedLessons={completedLessons}
            hasPractice={!!lesson.practice}
            onBack={() => navigate('/academy')}
            onNext={() => {
              setPhase('reading');
              setQuizScore(0);
              setDrillResult(null);
              setRestartTarget('units');
              navigate(`/academy/lesson/${nextLesson!.id}`);
            }}
            onRestart={handleRestart}
            onNavigateToTrack={(trackId) => navigate(`/academy/tracks?track=${trackId}`)}
          />
        )}
      </motion.div>
    </div>
  );
}
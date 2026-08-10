import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Sparkles, GraduationCap } from 'lucide-react';
import { transitionSlow } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import type { LevelInfo } from '../types';
import { resolveLessonTitle } from '../utils/titleKeys';

interface AcademyResumeProps {
  /** 当前活跃等级：首个解锁且仍有未完成课程的等级；全部完成则为 null */
  activeLevel: LevelInfo | null;
  completedLessons: string[];
  totalProgress: number;
  completedCount: number;
  totalLessons: number;
  levelsDoneCount: number;
  certifiedCount: number;
  /** 基础入门是否完成（控制首屏「全新用户」分支） */
  basicsCompleted: boolean;
}

/** 首屏"继续学习"：唯一主 CTA + 进度环 + 三项量化统计 */
export function AcademyResume({
  activeLevel,
  completedLessons,
  totalProgress,
  completedCount,
  totalLessons,
  levelsDoneCount,
  certifiedCount,
  basicsCompleted,
}: AcademyResumeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const nextLesson = activeLevel
    ? activeLevel.lessons.find((l) => !completedLessons.includes(l.id)) ?? activeLevel.lessons[0]
    : undefined;

  // 三态：fresh（未入门） / continue（学习中） / allDone（全部完成）
  const mode: 'fresh' | 'continue' | 'allDone' = !basicsCompleted
    ? 'fresh'
    : activeLevel
      ? 'continue'
      : 'allDone';

  const goCta = () => {
    if (mode === 'fresh') {
      navigate('/academy/basics');
      return;
    }
    if (mode === 'continue' && nextLesson) {
      navigate(`/academy/lesson/${nextLesson.id}`);
      return;
    }
    navigate('/academy/quick-drill');
  };

  const eyebrowText =
    mode === 'fresh'
      ? t('academy.resume.freshEyebrow')
      : mode === 'continue'
        ? t('academy.resume.eyebrow')
        : t('academy.resume.allDoneEyebrow');

  const headlineText =
    mode === 'fresh'
      ? t('academy.resume.freshHeadline')
      : mode === 'continue'
        ? t('academy.resume.continueLesson', {
            title: nextLesson ? resolveLessonTitle(t, nextLesson) : '',
          })
        : t('academy.resume.allDone');

  const sublineText =
    mode === 'fresh'
      ? t('academy.resume.freshSub')
      : mode === 'allDone'
        ? t('academy.resume.restartPractice')
        : null;

  const ctaLabel =
    mode === 'fresh'
      ? t('academy.resume.freshCta')
      : mode === 'continue'
        ? t('academy.resume.resume')
        : t('academy.tools.quickDrill');

  const CtaIcon =
    mode === 'allDone' ? Sparkles : mode === 'fresh' ? GraduationCap : PlayCircle;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionSlow}
      className="panel brass-rail academy-hero"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* 左侧：eyebrow + 主 CTA */}
        <div className="flex-1 min-w-0">
          <p className="section-eyebrow mb-2">{eyebrowText}</p>

          <p className="font-display text-[17px] text-[var(--ivory)] leading-snug">
            {headlineText}
          </p>

          {sublineText && (
            <p className="text-xs text-[var(--ivory-dim)] mt-1">{sublineText}</p>
          )}

          <button
            type="button"
            onClick={goCta}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-gradient-to-b from-[var(--brass-bright)] to-[var(--brass)] text-[var(--primary-foreground)] border border-[var(--brass-dark)] shadow-[0_3px_10px_rgba(201,162,94,0.25),inset_0_1px_0_rgba(255,240,200,0.55)] hover:brightness-110 transition-all"
          >
            <CtaIcon className="w-4 h-4" />
            {ctaLabel}
          </button>
        </div>

        {/* 右侧：进度环 + 三项统计 */}
        <div className="shrink-0 flex items-center gap-5 md:pl-4 md:border-l border-[var(--walnut-border)]/50">
          <ProgressRing value={totalProgress} />
          <dl className="academy-hero-stats">
            <Stat value={levelsDoneCount} label={t('academy.resume.levelsDone', { count: levelsDoneCount })} />
            <Stat value={`${completedCount}/${totalLessons}`} label={t('academy.resume.lessonsDone', { count: totalLessons })} />
            <Stat value={certifiedCount} label={t('academy.resume.certified', { count: certifiedCount })} />
          </dl>
        </div>
      </div>
    </motion.section>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[10px] text-[var(--ivory-muted)]">{label}</dt>
      <dd className="font-numeric text-sm text-[var(--brass-bright)]">{value}</dd>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 32;
  const strokeWidth = 6;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="var(--walnut-raised)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="var(--brass-bright)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-4 h-4 text-[var(--brass-bright)] mx-auto mb-0.5" />
          <span className="font-numeric text-xs text-[var(--ivory)]">{value}%</span>
        </div>
      </div>
    </div>
  );
}

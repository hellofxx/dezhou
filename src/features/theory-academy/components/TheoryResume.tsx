import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, Swords, GraduationCap } from 'lucide-react';
import { transitionSlow } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import type { TheoryLevelInfo } from '../types';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryResumeProps {
  /** 当前活跃等级（首个解锁且有未读章节）；全部完成则为 null */
  activeLevel: TheoryLevelInfo | null;
  completedChapters: string[];
  totalProgress: number;
  completedCount: number;
  totalChapters: number;
  levelsDoneCount: number;
  avgScore: number;
}

/** 首屏「继续学习」：fresh / continue / allDone 三态，CTA 直达下一章 */
export function TheoryResume({
  activeLevel,
  completedChapters,
  totalProgress,
  completedCount,
  totalChapters,
  levelsDoneCount,
  avgScore,
}: TheoryResumeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const nextChapter = activeLevel
    ? activeLevel.chapters.find((c) => !completedChapters.includes(c.id)) ?? activeLevel.chapters[0]
    : undefined;

  // 三态：fresh（一页未读）/ continue（学习中）/ allDone（全部读完）
  const mode: 'fresh' | 'continue' | 'allDone' = completedCount === 0
    ? 'fresh'
    : activeLevel
      ? 'continue'
      : 'allDone';

  const goCta = () => {
    if (mode === 'continue' && nextChapter) {
      navigate(`/theory/chapter/${nextChapter.id}`);
      return;
    }
    if (mode === 'allDone') {
      navigate('/academy');
      return;
    }
    // fresh：从首个等级第一课开始
    if (activeLevel) {
      const first = activeLevel.chapters[0];
      if (first) navigate(`/theory/chapter/${first.id}`);
    }
  };

  const eyebrowText =
    mode === 'fresh'
      ? t('theory.resume.eyebrowFresh')
      : mode === 'continue'
        ? t('theory.resume.eyebrow')
        : t('theory.resume.allDone');

  const headlineText =
    mode === 'continue' && nextChapter
      ? t('theory.resume.continueChapter', { title: resolveChapterTitle(t, nextChapter) })
      : mode === 'fresh'
        ? t('theory.resume.freshHeadline')
        : t('theory.resume.allDone');

  const sublineText =
    mode === 'fresh'
      ? t('theory.resume.freshSub')
      : mode === 'allDone'
        ? t('theory.resume.allDoneSub')
        : null;

  const ctaLabel =
    mode === 'fresh'
      ? t('theory.resume.startChapter')
      : mode === 'continue'
        ? t('theory.resume.continueCta')
        : t('theory.bridge.cta');

  const CtaIcon = mode === 'allDone' ? Swords : mode === 'fresh' ? GraduationCap : PlayCircle;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionSlow}
      className="panel brass-rail theory-hero"
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
          <TheoryProgressRing value={totalProgress} />
          <dl className="theory-hero-stats">
            <Stat value={`${completedCount}/${totalChapters}`} label={t('theory.resume.chaptersDoneLabel')} />
            <Stat value={levelsDoneCount} label={t('theory.resume.levelsDoneLabel')} />
            <Stat value={avgScore} label={t('theory.resume.avgScoreLabel')} />
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

function TheoryProgressRing({ value }: { value: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative w-[76px] h-[76px] shrink-0" role="img" aria-label={`${value}%`}>
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--walnut-raised)" strokeWidth="6" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="var(--brass-bright)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (value / 100) * circumference}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <BookOpen className="w-3.5 h-3.5 text-[var(--brass-bright)]" />
        <span className="font-numeric text-xs text-[var(--ivory)] mt-0.5">{value}%</span>
      </div>
    </div>
  );
}

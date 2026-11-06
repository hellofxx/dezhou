import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlayCircle, Swords, GraduationCap } from 'lucide-react';
import { transitionSlow } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import ProgressRing from '@/shared/components/data-display/ProgressRing';
import { StatPair } from '@/shared/components/data-display/StatPair';
import type { TheoryLevelSummary } from '../types';
import { loadTheoryLevelById } from '../data/levels/loaders';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryResumeProps {
  /** 当前活跃等级（首个解锁且有未读章节）；全部完成则为 null */
  activeLevel: TheoryLevelSummary | null;
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

  // 意图预取：悬停/聚焦继续学习卡时只加载当前 Level
  const prefetchLevel = () => {
    if (activeLevel) void loadTheoryLevelById(activeLevel.id);
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
      onPointerEnter={prefetchLevel}
      onFocus={prefetchLevel}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
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
            className="hover-bright mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold [background:var(--brass-fill-gradient)] text-[var(--brass-fill-ink)] border border-[var(--brass-fill-border)] shadow-[var(--shadow-brass-btn)] transition-all"
          >
            <CtaIcon className="w-4 h-4" />
            {ctaLabel}
          </button>
        </div>

        {/* 右侧：进度环 + 三项统计 */}
        <div className="shrink-0 flex items-center gap-5 md:pl-4 md:border-l border-[var(--walnut-border)]/50">
          <ProgressRing
            value={totalProgress}
            valueMax={100}
            size={76}
            variant="academy"
            ariaLabel={`${totalProgress}%`}
            center={
              <div className="flex flex-col items-center">
                <BookOpen className="w-3.5 h-3.5 text-[var(--brass-bright)]" />
                <span className="font-numeric text-xs text-[var(--ivory)] mt-0.5">
                  {totalProgress}%
                </span>
              </div>
            }
          />
          <StatPair
            className="theory-hero-stats"
            items={[
              {
                value: `${completedCount}/${totalChapters}`,
                label: t('theory.resume.chaptersDoneLabel'),
              },
              { value: levelsDoneCount, label: t('theory.resume.levelsDoneLabel') },
              { value: avgScore, label: t('theory.resume.avgScoreLabel') },
            ]}
          />
        </div>
      </div>
    </motion.section>
  );
}

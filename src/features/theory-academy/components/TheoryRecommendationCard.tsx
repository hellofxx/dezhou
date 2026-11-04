import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import type { TheoryChapterRecommendation } from '../data/theoryRecommendations';
import { findChapterSummaryById } from '../utils/theoryMeta';
import { resolveChapterSubtitle, resolveChapterTitle } from '../utils/titleKeys';

interface TheoryRecommendationCardProps {
  /** getTheoryChapterRecommendation 的结果；null 表示全部核心章已读完 */
  recommendation: TheoryChapterRecommendation | null;
  className?: string;
}

/**
 * 「接下来读什么」推荐卡（纯展示）。
 *
 * 输入已由 data/theoryRecommendations 按五维 ELO 算好，本组件不读 store、不做门禁判定：
 * 只把 chapterId 解析成标题 / 副标题并渲染链接，因此可以在首页同步渲染、不加载任何正文。
 * recommendation 为 null（全读完）时整卡不渲染，避免空壳。
 */
export function TheoryRecommendationCard({
  recommendation,
  className,
}: TheoryRecommendationCardProps) {
  const { t } = useTranslation();
  if (!recommendation) return null;

  const chapter = findChapterSummaryById(recommendation.chapterId);
  if (!chapter) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      aria-label={t('theory.recommendation.title')}
      className={className}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('theory.recommendation.title')}
      </h2>
      <div className="panel space-y-2">
        <div className="flex items-start gap-2">
          <Compass className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs text-[var(--ivory)] leading-snug">
              {resolveChapterTitle(t, chapter)}
            </p>
            <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed mt-0.5">
              {t(`theory.recommendation.reason.${recommendation.reason}`)}
            </p>
          </div>
        </div>
        <p className="text-[11px] text-[var(--ivory-muted)] leading-relaxed">
          {t('theory.recommendation.subtitle')}
        </p>
        <Link
          to={`/theory/chapter/${chapter.id}`}
          aria-label={`${t('theory.recommendation.cta')} · ${resolveChapterTitle(t, chapter)}`}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)]',
            'hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded',
          )}
        >
          {t('theory.recommendation.cta')}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <p className="text-[10px] text-[var(--ivory-dim)]">{resolveChapterSubtitle(t, chapter)}</p>
      </div>
    </motion.section>
  );
}

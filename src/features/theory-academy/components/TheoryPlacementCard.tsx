import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Compass, Target } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import type { TheoryPlacementResult } from '../types';
import { findLevelSummaryById } from '../utils/theoryMeta';
import { resolveTheoryLevelTitle } from '../utils/titleKeys';

/** 定位测评路由（由 platform 侧注册；本模块只拼字符串，不 import 评估侧组件） */
const PLACEMENT_ROUTE = '/theory/placement';

interface TheoryPlacementCardProps {
  placement?: TheoryPlacementResult;
  className?: string;
}

/**
 * 定位测评卡（首页）。
 *
 * 两态：
 * - 未测评：讲清测评做什么（只放宽解锁、不写已读章节）+ 开始入口
 * - 已测评：答对数 / 推荐起点 / 已免修 Level 徽章 + 重测入口；零免修时给「从 T1 起读」的正向说明
 *
 * 只读 store 快照（placement 由调用方传入），不发起任何写入。
 */
export function TheoryPlacementCard({ placement, className }: TheoryPlacementCardProps) {
  const { t } = useTranslation();
  const recommendedLevel = placement ? findLevelSummaryById(placement.recommendedLevelId) : undefined;
  const creditedLevels = (placement?.creditLevels ?? [])
    .map((levelId) => findLevelSummaryById(levelId))
    .filter((level) => level !== undefined);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.11 }}
      aria-label={t('theory.placement.title')}
      className={className}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('theory.placement.title')}
      </h2>
      <div className="panel space-y-2">
        {placement ? (
          <>
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory)]">
              <Target className="w-3.5 h-3.5 text-[var(--brass-bright)]" aria-hidden="true" />
              {t('theory.placement.score', {
                correct: placement.correct,
                total: placement.total,
                score: placement.score,
              })}
            </p>
            {recommendedLevel && (
              <p className="text-[11px] text-[var(--ivory-dim)]">
                {t('theory.placement.recommendedLevel', {
                  level: `T${recommendedLevel.level} · ${resolveTheoryLevelTitle(t, recommendedLevel)}`,
                })}
              </p>
            )}
            {creditedLevels.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] text-[var(--ivory-muted)]">
                  {t('theory.placement.creditLevels', {
                    levels: creditedLevels.map((level) => `T${level.level}`).join(' · '),
                  })}
                </p>
                <ul className="flex flex-wrap gap-1">
                  {creditedLevels.map((level) => (
                    <li
                      key={level.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--brass-deep)]/50 px-2 py-0.5 text-[10px] font-semibold text-[var(--brass-bright)]"
                    >
                      <Compass className="w-2.5 h-2.5" aria-hidden="true" />
                      T{level.level} {t('theory.placement.creditedBadge')}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-md border border-[var(--walnut-border)]/70 bg-[var(--felt-deep)]/50 p-2">
                <p className="text-[11px] text-[var(--ivory)] mb-0.5">
                  {t('theory.placement.zeroBasedTitle')}
                </p>
                <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">
                  {t('theory.placement.zeroBasedBody')}
                </p>
                <Link
                  to="/academy/basics"
                  className="mt-1 inline-flex min-h-11 items-center text-[11px] font-semibold text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
                >
                  {t('theory.placement.basicsCta')}
                </Link>
              </div>
            )}
            <Link
              to={PLACEMENT_ROUTE}
              className="inline-flex min-h-11 items-center text-[11px] font-semibold text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
            >
              {t('theory.placement.retake')}
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs text-[var(--ivory)] leading-relaxed">
              {t('theory.placement.subtitle')}
            </p>
            <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">
              {t('theory.placement.intro')}
            </p>
            <Link
              to={PLACEMENT_ROUTE}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--brass-fill)] px-3 py-2 text-xs font-semibold text-[var(--brass-fill-ink)] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              {t('theory.placement.start')}
            </Link>
          </>
        )}
        <p className="text-[10px] text-[var(--ivory-dim)] leading-relaxed">
          {t('theory.placement.disclaimer')}
        </p>
      </div>
    </motion.section>
  );
}

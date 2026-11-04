import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Lock, CheckCircle2, ClipboardCheck, Swords, Award } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { TheoryLevelSummary, TheoryTier } from '../types';
import { loadTheoryLevelById } from '../data/levels/loaders';
import {
  getCoreChaptersOfLevel,
  getSupplementalChaptersOfLevel,
} from '../utils/theoryMeta';
import {
  resolveTheoryLevelTitle,
  resolveTheoryLevelDescription,
  resolveTheoryLevelUnlock,
} from '../utils/titleKeys';
import { TheoryChapterChip } from './TheoryChapterChip';

const TIER_LABEL_KEY: Record<TheoryTier, string> = {
  basic: 'theory.tierBasic',
  intermediate: 'theory.tierIntermediate',
  advanced: 'theory.tierAdvanced',
};

const TIER_CLASS: Record<TheoryTier, string> = {
  basic: 'text-[var(--poker-success)] bg-[var(--poker-success)]/12 border-[var(--poker-success)]/30',
  intermediate: 'text-[var(--brass-bright)] bg-[var(--brass-bright)]/10 border-[var(--brass-bright)]/25',
  advanced: 'text-[var(--poker-info)] bg-[var(--poker-info)]/12 border-[var(--poker-info)]/30',
};

interface TheoryLadderProps {
  levels: TheoryLevelSummary[];
  completedChapters: string[];
  quizScores: Record<string, number>;
  isUnlocked: (levelId: string) => boolean;
  /** 定位测评免修的 Level id 列表（渲染「定位免修」徽章，不改变解锁判定） */
  creditLevels?: readonly string[];
  /** 已收藏章节 id 列表（渲染书签标记与切换按钮） */
  bookmarkedChapters?: readonly string[];
  /** Level checkpoint 记录（levelId → 记录）；有记录时在入口旁显示历史最佳 */
  checkpoints?: Record<string, { bestScore: number }>;
  /** 收藏切换回调（store.toggleBookmark）；缺省时不渲染收藏按钮 */
  onToggleBookmark?: (chapterId: string) => void;
}

/**
 * 推导当前活跃理论等级：首个解锁且仍有未读**核心章**的等级；全部核心章读完则为 null。
 * 增补章不参与活跃判定（补强进度见侧栏卡片与各级展开区的补强计数）。
 */
export function findActiveTheoryLevelId(
  levels: TheoryLevelSummary[],
  completedChapters: string[],
  isUnlocked: (levelId: string) => boolean,
): string | null {
  for (const level of levels) {
    if (!isUnlocked(level.id)) continue;
    if (getCoreChaptersOfLevel(level).some((c) => !completedChapters.includes(c.id))) return level.id;
  }
  return null;
}

/**
 * 理论进阶阶梯：T1-T9 以黄铜节点 + 发线脊柱纵向呈现，活跃等级自动展开章节 chips。
 * 本批新增三种只读标记：定位免修徽章（creditLevels）、本级检查点入口（核心章读完后开放）、
 * 章节收藏标记与切换（bookmarkedChapters）。三者都不参与解锁判定。
 */
export function TheoryLadder({
  levels,
  completedChapters,
  quizScores,
  isUnlocked,
  creditLevels = [],
  bookmarkedChapters = [],
  checkpoints = {},
  onToggleBookmark,
}: TheoryLadderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeId = findActiveTheoryLevelId(levels, completedChapters, isUnlocked);
  const [expandedId, setExpandedId] = useState<string | null>(activeId);
  // 意图预取：只加载当前活跃 Level；展开某 Level 后悬停其章节 chips 时再补该 Level
  const prefetchLevel = (levelId: string | undefined) => {
    if (levelId) void loadTheoryLevelById(levelId);
  };

  const openChapter = (chapterId: string) => navigate(`/theory/chapter/${chapterId}`);

  const handleHeadClick = (level: TheoryLevelSummary, expanded: boolean) => {
    if (expanded) {
      // 头部点击优先进入首个未完成核心章；核心章全读完才回退到增补章
      const core = getCoreChaptersOfLevel(level);
      const target =
        core.find((c) => !completedChapters.includes(c.id))
        ?? getSupplementalChaptersOfLevel(level).find((c) => !completedChapters.includes(c.id))
        ?? core[0]
        ?? level.chapters[0];
      if (target) openChapter(target.id);
    } else {
      setExpandedId(level.id);
    }
  };

  return (
    <section
      aria-label={t('theory.ladder.title')}
      onPointerEnter={() => prefetchLevel(activeId ?? levels[0]?.id)}
      onFocus={() => prefetchLevel(activeId ?? levels[0]?.id)}
    >
      <div className="px-1 mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
          {t('theory.ladder.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('theory.ladder.subtitle')}</p>
      </div>

      <div className="level-ladder space-y-1">
        {levels.map((level, index) => {
          const unlocked = isUnlocked(level.id);
          // Level 进度口径 = 核心章（增补章完成不改变 N/N 文案与进度条）
          const coreChapters = getCoreChaptersOfLevel(level);
          const supplementalChapters = getSupplementalChaptersOfLevel(level);
          const completedInLevel = coreChapters.filter((c) => completedChapters.includes(c.id)).length;
          const totalInLevel = coreChapters.length;
          const progress = totalInLevel > 0 ? Math.round((completedInLevel / totalInLevel) * 100) : 0;
          const allCompleted = progress === 100;
          const nextCoreId = coreChapters.find((c) => !completedChapters.includes(c.id))?.id;
          const supplementalDone = supplementalChapters.filter((c) =>
            completedChapters.includes(c.id)
          ).length;
          const isActive = level.id === activeId;
          const expanded = level.id === expandedId;
          const credited = creditLevels.includes(level.id);
          const checkpoint = checkpoints[level.id];

          // 理论→实践桥接：优先推荐轨道，无轨道则取首个推荐课程，派生策略学院链接
          const rec = level.practiceRecommendations;
          const practiceTarget = rec.trackId
            ? `/academy/tracks?track=${rec.trackId}`
            : rec.lessons[0]
              ? `/academy/lesson/${rec.lessons[0].id}`
              : null;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitionStandard, delay: 0.08 + index * 0.05 }}
              className={cn(
                'level-row',
                unlocked ? 'unlocked' : 'locked',
                allCompleted && 'completed',
                isActive && 'active'
              )}
            >
              {/* 节点列 */}
              <div className="level-node flex flex-col items-center">
                <span className="level-node-badge" aria-hidden="true">
                  {allCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : unlocked ? (
                    <span className="font-numeric text-[11px]">T{level.level}</span>
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </span>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="level-you-here"
                  >
                    {t('theory.ladder.youAreHere')}
                  </motion.span>
                )}
              </div>

              {/* 行主体 */}
              <div className="flex-1 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => handleHeadClick(level, expanded)}
                  disabled={!unlocked}
                  aria-expanded={unlocked ? expanded : undefined}
                  className="level-row-head w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'text-xl leading-none mt-0.5 shrink-0',
                        unlocked ? 'opacity-100' : 'opacity-40 grayscale'
                      )}
                      aria-hidden="true"
                    >
                      {level.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold tracking-wide',
                            TIER_CLASS[level.tier]
                          )}
                        >
                          {t(TIER_LABEL_KEY[level.tier])}
                        </span>
                        {credited && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--poker-info)]/40 bg-[var(--poker-info)]/12 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--poker-info)]">
                            <Award className="w-2.5 h-2.5" aria-hidden="true" />
                            {t('theory.level.creditedBadge')}
                          </span>
                        )}
                        {allCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--poker-success)]">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('theory.chapters')} · {t('theory.ladder.chapterDone', { done: completedInLevel, total: totalInLevel })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[15px] text-[var(--ivory)] leading-tight">
                        {resolveTheoryLevelTitle(t, level)}
                      </h3>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          unlocked ? 'text-[var(--ivory-muted)]' : 'text-[var(--ivory-muted)]/70'
                        )}
                      >
                        {unlocked
                          ? resolveTheoryLevelDescription(t, level)
                          : resolveTheoryLevelUnlock(t, level)}
                      </p>

                      {unlocked && !allCompleted && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="text-[10px] text-[var(--ivory-dim)] font-numeric shrink-0">
                            {t('theory.ladder.chapterDone', { done: completedInLevel, total: totalInLevel })}
                          </span>
                          <div className="h-1 flex-1 max-w-[160px] rounded-full bg-[var(--walnut-raised)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--brass-bright)] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {unlocked && (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-[var(--ivory-muted)] mt-1 shrink-0 transition-transform duration-200',
                          expanded && 'rotate-180 text-[var(--brass-bright)]'
                        )}
                      />
                    )}
                  </div>
                </button>

                {/* 展开的章节 chips */}
                {unlocked && expanded && (
                  <div className="pl-1 pt-3 mt-1 border-t border-[var(--walnut-border)]/50">
                    <ul
                      className="lesson-chip-grid"
                      aria-label={t('theory.ladder.chapterList', { title: resolveTheoryLevelTitle(t, level) })}
                      onPointerEnter={() => prefetchLevel(level.id)}
                      onFocus={() => prefetchLevel(level.id)}
                    >
                      {level.chapters.map((chapter) => (
                        <TheoryChapterChip
                          key={chapter.id}
                          chapter={chapter}
                          completed={completedChapters.includes(chapter.id)}
                          isNext={chapter.id === nextCoreId}
                          score={quizScores[chapter.id]}
                          bookmarked={bookmarkedChapters.includes(chapter.id)}
                          onOpen={() => openChapter(chapter.id)}
                          {...(onToggleBookmark
                            ? { onToggleBookmark: () => onToggleBookmark(chapter.id) }
                            : {})}
                        />
                      ))}
                    </ul>

                    {supplementalChapters.length > 0 && (
                      <p className="mt-2 text-[10px] text-[var(--ivory-dim)] font-numeric">
                        {t('theory.ladder.supplementalProgress', {
                          done: supplementalDone,
                          total: supplementalChapters.length,
                        })}
                      </p>
                    )}

                    {/* 本级检查点：核心章读完后开放，形成性自查（不解锁下一级、不发证） */}
                    {allCompleted && (
                      <Link
                        to={`/theory/checkpoint/${level.id}`}
                        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--poker-info)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        {t('theory.level.checkpointEntry')}
                        {checkpoint && (
                          <span className="font-numeric text-[10px] text-[var(--ivory-muted)]">
                            {t('theory.checkpoint.bestScore', { score: checkpoint.bestScore })}
                          </span>
                        )}
                      </Link>
                    )}

                    {allCompleted && practiceTarget && (
                      <button
                        type="button"
                        onClick={() => navigate(practiceTarget)}
                        className="mt-3 ml-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        {t('theory.ladder.applyPractice')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

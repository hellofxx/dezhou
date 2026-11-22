import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, BookOpen, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { TheoryChapter, TheoryChapterSummary, TheoryLevelInfo } from '../types';
import { PracticeBridgeCard } from './PracticeBridgeCard';
import { NextChapterNav } from './NextChapterNav';

interface TheoryChapterDoneProps {
  result: { score: number; correct: number; total: number } | null;
  chapter: TheoryChapter;
  level: TheoryLevelInfo;
  levelCompleted: boolean;
  nextChapter: TheoryChapterSummary | undefined;
  nextChapterUnlocked: boolean;
  onRetry: () => void;
  onBackToChapters: () => void;
}

/**
 * 章末小测完成态（TheoryChapterView 的 done 阶段装配体）：
 * 得分摘要 + 实践桥接推荐（章节粒度被 Level 推荐覆盖时去重）+ 导航 + 检查点入口。
 */
export function TheoryChapterDone({
  result,
  chapter,
  level,
  levelCompleted,
  nextChapter,
  nextChapterUnlocked,
  onRetry,
  onBackToChapters,
}: TheoryChapterDoneProps) {
  const { t } = useTranslation();
  // 章节粒度桥接与 Level 粒度共存时的去重：章节推荐若已被 Level 推荐覆盖且本级已全部完成，
  // 只保留更宽的 Level 卡，避免同一列表在同屏重复渲染两次
  const chapterRecommendations = chapter.practiceRecommendations;
  const chapterCoveredByLevel =
    !!chapterRecommendations &&
    levelCompleted &&
    chapterRecommendations.lessons.every((lesson) =>
      level.practiceRecommendations.lessons.some((item) => item.id === lesson.id),
    );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* 小测得分摘要 */}
      {result ? (
        <div className="panel text-center py-6">
          {result.score >= 70 ? (
            <Trophy size={36} className="mx-auto mb-3 text-[var(--brass-bright)]" aria-hidden="true" />
          ) : (
            <BookOpen size={36} className="mx-auto mb-3 text-[var(--ivory-muted)]" aria-hidden="true" />
          )}
          <h2 className="font-display text-xl text-[var(--ivory)] mb-1">{t('theory.chapterView.chapterDone')}</h2>
          <p className="text-sm text-[var(--ivory-dim)] mb-1">
            {t('theory.chapterView.answered', { correct: result.correct, total: result.total })}
          </p>
          <p className="font-numeric text-3xl text-[var(--brass-bright)]">{t('theory.chapterView.score', { score: result.score })}</p>
        </div>
      ) : null}
      {/* 章节粒度实践推荐（被 Level 推荐覆盖时不重复展示） */}
      {chapterRecommendations && !chapterCoveredByLevel ? (
        <PracticeBridgeCard
          recommendations={chapterRecommendations}
          subtitleKey="theory.bridge.chapterSubtitle"
        />
      ) : null}
      {/* Level 全部完成时展示实践桥接推荐 */}
      {levelCompleted ? <PracticeBridgeCard recommendations={level.practiceRecommendations} /> : null}
      <div className="panel flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/lesson"
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--brass)]/40 px-4 py-2 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-glow)] ${FOCUS_RING}`}
          >
            {t('theory.chapterView.backToCourseHub')}
          </Link>
          <button
            onClick={onBackToChapters}
            className={`inline-flex min-h-11 items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors ${FOCUS_RING}`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('theory.chapterView.backToChapters')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRetry}
            className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
          >
            {t('theory.retryQuiz')}
          </button>
          <NextChapterNav nextChapter={nextChapter} unlocked={nextChapterUnlocked} />
        </div>
      </div>
      {/* 检查点入口：本级核心章读完后可自查（不解锁下一级、不发证） */}
      {levelCompleted ? (
        <div className="max-w-3xl mx-auto">
          <Link
            to={`/theory/checkpoint/${level.id}`}
            className={`inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--poker-info)] hover:underline rounded ${FOCUS_RING}`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" aria-hidden="true" />
            {t('theory.level.checkpointEntry')}
          </Link>
        </div>
      ) : null}
    </motion.div>
  );
}
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AcademyMasteryCard } from '@/shared/components/academy';
import type { MasterySummary } from '@/shared/types/academy';
import type { TheoryChapterAttempt, TheoryChapterSummary } from '../types';
import { isSupplementalChapter } from '../utils/theoryMeta';
import { resolveChapterTitle } from '../utils/titleKeys';
import { summarizeMastery } from '../utils/theoryMastery';

interface TheoryMasteryCardProps {
  /** 参与统计的章节目录；增补章（supplemental）在本卡内剔除——掌握度只计核心章 */
  chapters: TheoryChapterSummary[];
  /** 章末小测历史最高分（chapterId → 0-100） */
  quizScores: Record<string, number>;
  /**
   * 章末小测尝试记录（可选）：传入时掌握度按**首次成绩**口径统计，
   * 省略时退化为 quizScores（历史最高分），与旧调用方兼容。
   */
  chapterAttempts?: Record<string, TheoryChapterAttempt>;
}

/**
 * 掌握度卡：从既有 quizScores / chapterAttempts 派生的四项计数 + 复习/继续 CTA。
 *
 * 展示层改用两院共享 `AcademyMasteryCard`（四档计数 + 最弱项 CTA + footer 插槽），
 * 本组件只做理论侧适配：统计范围按 core / 增补二分单源（`isSupplementalChapter`）收窄到核心章；
 * 增补章读完只影响 6-max 补强进度，不参与核心掌握度；成绩口径仍由 theoryMastery 的
 * `summarizeMastery` 给出（有 chapterAttempts 时取首次成绩，重考不改掌握度）；
 * 练习最佳放共享卡 `footer` 插槽。
 *
 * 评估入口（定位测评 / 检查点）统一收敛到地图评估区（`TheoryAssessmentCard`），
 * 本卡不再复制检查点 CTA，避免同一入口两处出现。
 *
 * 只读 props，不调用任何解锁门禁、不写 store（PRD §5.27.2：掌握度只展示，不改变解锁）。
 */
export function TheoryMasteryCard({
  chapters,
  quizScores,
  chapterAttempts,
}: TheoryMasteryCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const coreChapters = chapters.filter((chapter) => !isSupplementalChapter(chapter));
  const theorySummary = summarizeMastery(coreChapters, quizScores, chapterAttempts);
  // 共享卡口径为 `weakestId`，理论派生函数沿用 `weakestChapterId`（同一语义，仅改名）
  const summary: MasterySummary = { ...theorySummary, weakestId: theorySummary.weakestChapterId };
  const testedCount = summary.total - summary.untested;

  // 练习口径最佳：只统计本卡范围内的章节（重考刷分不改变掌握度，但值得展示）
  const practiceBest = coreChapters.reduce((best, chapter) => {
    const attempt = chapterAttempts?.[chapter.id];
    if (!attempt) return best;
    return Math.max(best, attempt.bestScore);
  }, 0);
  const hasPractice = coreChapters.some((chapter) => chapterAttempts?.[chapter.id] !== undefined);

  // 有已测章节 → 复习最低分章；全未测 → 继续学习（首个未测章，全部有分时退化为首章）
  const weakestChapter = summary.weakestId
    ? coreChapters.find((chapter) => chapter.id === summary.weakestId)
    : undefined;
  const nextChapter =
    weakestChapter ??
    coreChapters.find((chapter) => quizScores[chapter.id] === undefined) ??
    coreChapters[0];

  const hasFooter = hasPractice || testedCount === 0;

  const footer = !hasFooter ? undefined : (
    <div className="space-y-2">
      {hasPractice && (
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[var(--poker-info)]/12 text-[var(--poker-info)]"
            aria-hidden="true"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
          <span className="flex-1 text-xs text-[var(--ivory-muted)]">
            {t('theory.quiz.bestScoreLabel')}
            <span className="block text-[10px] text-[var(--ivory-dim)]">
              {t('theory.quiz.practiceOnly')}
            </span>
          </span>
          <span className="font-numeric text-sm text-[var(--ivory)]">{practiceBest}</span>
        </div>
      )}

      {testedCount === 0 && (
        <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">{t('theory.mastery.empty')}</p>
      )}
    </div>
  );

  return (
    <AcademyMasteryCard
      title={t('theory.mastery.title')}
      subtitle={t('theory.mastery.subtitle')}
      summary={summary}
      labels={{
        mastered: t('theory.mastery.mastered'),
        passing: t('theory.mastery.passing'),
        needsReview: t('theory.mastery.needsReview'),
        untested: t('theory.mastery.untested'),
        total: t('theory.mastery.total'),
      }}
      footer={footer}
      weakest={
        nextChapter
          ? {
              label: resolveChapterTitle(t, nextChapter),
              route: `/theory/chapter/${nextChapter.id}`,
              ctaLabel: weakestChapter
                ? t('theory.mastery.reviewWeakest')
                : t('theory.mastery.continue'),
              onNavigate: navigate,
            }
          : undefined
      }
    />
  );
}

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AcademyStickyCta, AcademyTakeawayCard } from '@/shared/components/academy';
import { Button } from '@/shared/components/ui/button';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { assembleTakeawayItems } from '@/shared/utils/academyTakeaway';
import type { TheoryChapter, TheoryChapterAttempt, TheoryChapterSummary } from '../types';
import { groupTheorySections } from '../utils/theorySectionGroups';
import { resolveTheoryObjectives, theoryContentKey } from '../utils/contentKeys';
import { TheorySectionRenderer } from './TheorySectionRenderer';
import { TheoryCalcDrill } from './TheoryCalcDrill';
import { TheoryVariantRuleCard } from './TheoryVariantRuleCard';
import { NextChapterNav } from './NextChapterNav';

interface TheoryChapterBodyProps {
  chapter: TheoryChapter;
  /** 持久化尝试记录：决定作答口径横幅（首次 / 练习） */
  attempt: TheoryChapterAttempt | undefined;
  chapterCompleted: boolean;
  nextChapter: TheoryChapterSummary | undefined;
  nextChapterUnlocked: boolean;
  /** 当前 location.state：下一章页沿用同一返回来源 */
  nextChapterState?: unknown;
  onStartQuiz: () => void;
  onBackToChapters: () => void;
  /** 来源感知返回文案（nav.* 已解析）；缺省沿用章节目录文案 */
  backLabel?: string;
}

/**
 * 章节阅读正文（TheoryChapterView 的 reading 阶段装配体）。
 *
 * 渐进披露（Fix 4）：按 heading 分组，本地 revealedCount（初始 1）+ 折叠头逐组展开，
 * 末组「继续下一节」递增 + 「展开全部」逃生口。**零 persist**：披露是阅读节奏而非学习进度，
 * 不新增 store 字段（theory v5 不动）。CTA 恒在底部，披露不阻塞进入小测。
 *
 * 章末要点卡（Fix 2）：无显式 takeaway 块时自动装配（objectives 在前 + key-point 在后，
 * 全部经 i18n key 解析，en 不泄漏中文）；有显式块的变体章节短路不双卡。
 */
export function TheoryChapterBody({
  chapter,
  attempt,
  chapterCompleted,
  nextChapter,
  nextChapterUnlocked,
  nextChapterState,
  onStartQuiz,
  onBackToChapters,
  backLabel,
}: TheoryChapterBodyProps) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupTheorySections(chapter.content), [chapter.content]);
  const [revealedCount, setRevealedCount] = useState(1);
  const [expandedOrdinals, setExpandedOrdinals] = useState<ReadonlySet<number>>(new Set());

  const takeawayItems = useMemo(() => {
    if (chapter.content.some((section) => section.type === 'takeaway')) return [];
    const keyPointTexts = chapter.content
      .map((section, rawIndex) => ({ section, rawIndex }))
      .filter(({ section }) => section.type === 'key-point')
      .map(({ section, rawIndex }) =>
        t(theoryContentKey(chapter.id, rawIndex), { defaultValue: section.content }),
      );
    return assembleTakeawayItems(
      resolveTheoryObjectives(t, chapter.id, chapter.objectives ?? []),
      keyPointTexts,
    );
  }, [chapter, t]);

  const expandGroup = (ordinal: number) => {
    setExpandedOrdinals((current) => new Set([...current, ordinal]));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 pb-24 md:pb-6 max-w-3xl mx-auto"
    >
      {/* 正文容器与 strategy-academy CourseView 完全一致（居中 max-w-3xl walnut-panel） */}
      <div className="space-y-6">
        {/* 单挑规则卡：正文之前的规则先行（仅 heads-up 章节，标准 / 短牌由组件自判返回 null） */}
        <TheoryVariantRuleCard chapter={chapter} />
        {groups.map((group, groupIndex) => {
          const revealed = groupIndex < revealedCount || expandedOrdinals.has(group.headingOrdinal);
          const head = group.entries[0];
          if (revealed || !head) {
            return (
              <div key={group.headingOrdinal} className="space-y-6">
                {group.entries.map(({ section, rawIndex }) => (
                  <TheorySectionRenderer
                    key={rawIndex}
                    section={section}
                    contentKey={theoryContentKey(chapter.id, rawIndex)}
                    chapterOrder={chapter.order}
                    sectionOrdinal={group.headingOrdinal}
                  />
                ))}
              </div>
            );
          }
          // 折叠头：§号 + 标题 + ChevronDown，点击仅本地展开（不写 store）
          return (
            <button
              key={group.headingOrdinal}
              type="button"
              onClick={() => expandGroup(group.headingOrdinal)}
              aria-expanded={false}
              className={`flex w-full items-center gap-2.5 rounded-lg border border-dashed border-[var(--walnut-border)] px-4 py-3 text-left transition-colors hover:border-[var(--brass)]/50 hover:bg-[var(--walnut-raised)]/30 ${FOCUS_RING}`}
            >
              <span className="section-number shrink-0" aria-hidden="true">
                {`§${chapter.order}.${group.headingOrdinal}`}
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-sm text-[var(--ivory-dim)]">
                {t(theoryContentKey(chapter.id, head.rawIndex), { defaultValue: head.section.content })}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ivory-muted)]" aria-hidden="true" />
            </button>
          );
        })}
        {revealedCount < groups.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="quiet"
              size="sm"
              onClick={() => setRevealedCount((count) => Math.min(count + 1, groups.length))}
            >
              {t('theory.chapterView.continueNext')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="quiet" size="sm" onClick={() => setRevealedCount(groups.length)}>
              {t('theory.chapterView.expandAll')}
            </Button>
          </div>
        ) : null}
        {takeawayItems.length > 0 ? <AcademyTakeawayCard items={takeawayItems} /> : null}
      </div>
      {/* 读→算→测微闭环：正文之后、小测之前给当场计算；未登记演练槽的章节不渲染 */}
      <TheoryCalcDrill key={chapter.id} chapterId={chapter.id} />
      {/* 作答口径横幅：首次作答计入掌握度与能力分，重考只更新练习成绩 */}
      <p className="mt-4 rounded-md border border-[var(--walnut-border)]/70 bg-[var(--felt-deep)]/50 px-3 py-2 text-[11px] leading-relaxed text-[var(--ivory-dim)]">
        {attempt
          ? `${t('theory.quiz.practiceAttempt')} · ${t('theory.quiz.retryPracticeHint')}`
          : `${t('theory.quiz.firstAttempt')} · ${t('theory.quiz.firstAttemptHint')}`}
      </p>
      {chapterCompleted ? (
        // 已完成章节：免重考复习导航（返回目录/下一章）+ 可选重考（幂等，取历史最高分）
        <div className="pt-4 mt-2 border-t border-[var(--walnut-border)]/50 flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <button
            onClick={onBackToChapters}
            className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80 transition-colors ${FOCUS_RING}`}
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel ?? t('theory.chapterView.backToChapters')}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onStartQuiz}
              className={`inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
            >
              {t('theory.chapterView.retryQuiz')}
            </button>
            <NextChapterNav
              nextChapter={nextChapter}
              unlocked={nextChapterUnlocked}
              state={nextChapterState}
            />
          </div>
        </div>
      ) : (
        <div className="pt-4 mt-2 border-t border-[var(--walnut-border)]/50">
          {/* 移动 sticky CTA（AcademyStickyCta 单节点）；Button default 保 btn-brass 金属件 */}
          <AcademyStickyCta>
            <Button variant="default" onClick={onStartQuiz} className="min-h-11 w-full md:w-auto">
              {t('theory.chapterView.startQuiz')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </AcademyStickyCta>
        </div>
      )}
    </motion.div>
  );
}
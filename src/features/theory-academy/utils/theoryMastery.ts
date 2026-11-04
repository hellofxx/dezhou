import type { TheoryChapterAttempt, TheoryChapterSummary } from '../types';

/**
 * 理论学院掌握度派生（展示层，不门禁）。
 *
 * 口径（PRD §5.27.2）：掌握度优先取 `chapterAttempts[chapterId].firstScore`（章末小测首次成绩），
 * 无 attempts 记录（老数据 / 尚未迁移）时回退 `quizScores`（历史最高分）。
 * 重考只更新 bestScore / lastScore，不影响掌握度；本节不写 store，不参与任何解锁判定。
 * "已掌握 / 通过 / 待复习"三档阈值只在这里定义一次。
 */

/** 掌握度阈值（唯一事实源）：≥80 已掌握，60–79 通过，<60 待复习 */
export const MASTERY_THRESHOLDS = { mastered: 80, passing: 60 } as const;

/** 单章掌握度状态；无小测记录（undefined）为未测 */
export type MasteryState = 'mastered' | 'passing' | 'needsReview' | 'untested';

/** 按分数归入掌握度状态（分数区间为闭开组合：≥80 / 60–79 / <60） */
export function getMasteryState(score: number | undefined): MasteryState {
  if (typeof score !== 'number') return 'untested';
  if (score >= MASTERY_THRESHOLDS.mastered) return 'mastered';
  if (score >= MASTERY_THRESHOLDS.passing) return 'passing';
  return 'needsReview';
}

/**
 * 掌握度分数口径（单源）：首次成绩优先，缺失时回退 quizScores 历史最高分。
 * 迁移种子化记录中的 firstScore 可能为 0，但 0 是合法分数，不回退（避免把「首次考砸」显示成未测）。
 */
export function resolveFirstScore(
  chapterId: string,
  quizScores: Record<string, number>,
  chapterAttempts?: Record<string, TheoryChapterAttempt>,
): number | undefined {
  const attempt = chapterAttempts?.[chapterId];
  if (attempt) return attempt.firstScore;
  return quizScores[chapterId];
}

/** 掌握度汇总：四项计数 + 总数 + 最弱章（供「复习最弱一章」CTA） */
export interface MasterySummary {
  mastered: number;
  passing: number;
  needsReview: number;
  untested: number;
  /** 传入章节数（调用方传入的集合决定统计范围） */
  total: number;
  /** 已测章节中分数最低者；同分取传入顺序（manifest 顺序）里靠前的那一章；无已测章节时 undefined */
  weakestChapterId: string | undefined;
}

/**
 * 汇总掌握度。
 *
 * 只统计 `chapters` 里出现的章节（调用方传 core 章节列表，增补章不计入核心掌握度）；
 * 集合外章节即使有分数也不进入任何计数——统计范围由调用方的入参决定，本函数不做二次筛选。
 * `chapterAttempts` 为可选第三参数：传入时按首次成绩口径，省略时行为与旧版一致（quizScores 最高分）。
 */
export function summarizeMastery(
  chapters: readonly TheoryChapterSummary[],
  quizScores: Record<string, number>,
  chapterAttempts?: Record<string, TheoryChapterAttempt>,
): MasterySummary {
  const counts: Record<MasteryState, number> = {
    mastered: 0,
    passing: 0,
    needsReview: 0,
    untested: 0,
  };
  let weakestChapterId: string | undefined;
  let weakestScore = Number.POSITIVE_INFINITY;

  for (const chapter of chapters) {
    const score = resolveFirstScore(chapter.id, quizScores, chapterAttempts);
    counts[getMasteryState(score)] += 1;
    // 严格小于：同分时保留先出现的那一章（传入顺序即目录顺序，结果稳定）
    if (typeof score === 'number' && score < weakestScore) {
      weakestScore = score;
      weakestChapterId = chapter.id;
    }
  }

  return {
    mastered: counts.mastered,
    passing: counts.passing,
    needsReview: counts.needsReview,
    untested: counts.untested,
    total: chapters.length,
    weakestChapterId,
  };
}

import type { TheoryChapterSummary } from '../types';

/**
 * 理论学院掌握度派生（展示层，不门禁）。
 *
 * 口径唯一事实源：掌握度只从既有持久化字段 `quizScores`（章末小测历史最高分）派生，
 * 不新增状态、不写 store、不参与任何解锁判定（PRD §5.27.2）。
 * 因此本节不引入额外的分数档位，"已掌握 / 通过 / 待复习"三档阈值只在这里定义一次。
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
 */
export function summarizeMastery(
  chapters: readonly TheoryChapterSummary[],
  quizScores: Record<string, number>,
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
    const score = quizScores[chapter.id];
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

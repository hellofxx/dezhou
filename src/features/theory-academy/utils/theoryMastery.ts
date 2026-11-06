import type { MasterySummary } from '@/shared/types/academy';
import { summarizeMastery as summarizeAcademyMastery } from '@/shared/utils/academyMastery';
import type { TheoryChapterAttempt, TheoryChapterSummary } from '../types';

/**
 * 理论学院掌握度派生（展示层，不门禁）。
 *
 * 口径（PRD §5.27.2）：掌握度优先取 `chapterAttempts[chapterId].firstScore`（章末小测首次成绩），
 * 无 attempts 记录（老数据 / 尚未迁移）时回退 `quizScores`（历史最高分）。
 * 重考只更新 bestScore / lastScore，不影响掌握度；本节不写 store，不参与任何解锁判定。
 *
 * 收口（2026-11）：阈值与状态归类唯一实现位于 `shared/utils/academyMastery.ts`（两院共用），
 * 本文件只保留理论侧的首次成绩解析与薄包装，不再保存第二份阈值 / `getMasteryState` / 汇总循环。
 */

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

/** 理论侧掌握度汇总：共享口径 + 章节 id 字段别名（保持 TheoryMasteryCard 既有签名） */
export interface TheoryMasterySummary extends MasterySummary {
  /** 已测章节中首次成绩最低者；同分取传入顺序（目录顺序）里靠前的那一章；无已测章节时 undefined */
  weakestChapterId: string | undefined;
}

/**
 * 汇总掌握度（理论侧薄包装）。
 *
 * 先把每章解析成掌握度分数（首次成绩口径，见 `resolveFirstScore`），
 * 再委托 `shared/utils/academyMastery.summarizeMastery` 做四档归类与最弱项判定——
 * 统计范围仍由入参 `chapters` 决定（增补章由调用方先剔除）。
 */
export function summarizeMastery(
  chapters: readonly TheoryChapterSummary[],
  quizScores: Record<string, number>,
  chapterAttempts?: Record<string, TheoryChapterAttempt>,
): TheoryMasterySummary {
  const scores: Record<string, number | undefined> = {};
  for (const chapter of chapters) {
    scores[chapter.id] = resolveFirstScore(chapter.id, quizScores, chapterAttempts);
  }
  const summary = summarizeAcademyMastery(chapters, scores);
  return { ...summary, weakestChapterId: summary.weakestId };
}

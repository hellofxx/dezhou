import type { EloDimension } from '@/shared/types/elo';
import type {
  TheoryChapter,
  TheoryCheckpointAttempt,
  TheoryLevelInfo,
  TheoryQuizQuestion,
} from '../types';
import { hashStringToSeed, shuffleBySeed } from '@/shared/utils/seededShuffle';
import { isLevelFullyCompleted } from './theoryMeta';

/**
 * Level 检查点（形成性自查）抽题与统计（纯函数，零 store 依赖）。
 *
 * 口径（PRD §5.27.8）：
 * - 只在**本级核心章全部完成**后开放（增补章不参与，无完成记录不开放）；
 * - 从本级核心章的小测题库抽 12 题，题目带来源章 chapterId 与 eloDimension（复盘与 ELO 归属）；
 * - 种子 = `hash(<levelId>#checkpoint#<attemptNumber>)`：同一次重抽确定，重考换题；
 * - 检查点**不解锁**下一级、不发证书，只记成绩与错题（SRS）+ 首次尝试的 ELO。
 */

/** 检查点题量 */
export const CHECKPOINT_QUESTION_COUNT = 12;

export interface TheoryCheckpointQuestion {
  question: TheoryQuizQuestion;
  /** 题目来源章 id（错题 SRS 复习项路由到该章） */
  chapterId: string;
  /** 来源章的 ELO 维度（首次检查点按题更新 ELO 时使用） */
  eloDimension: EloDimension;
}

/** 本次检查点序号（首次 = 1） */
export function getCheckpointAttemptNumber(
  checkpoints: Record<string, TheoryCheckpointAttempt> | undefined,
  levelId: string,
): number {
  return (checkpoints?.[levelId]?.attempts ?? 0) + 1;
}

/** 是否首次检查点（决定是否按题更新 ELO） */
export function isFirstCheckpointAttempt(
  checkpoints: Record<string, TheoryCheckpointAttempt> | undefined,
  levelId: string,
): boolean {
  return (checkpoints?.[levelId]?.attempts ?? 0) === 0;
}

/** 门禁：本级核心章全部完成才开放（debug 短路由调用方在 store 层处理） */
export function isCheckpointUnlocked(
  levelId: string,
  completedChapters: readonly string[],
): boolean {
  return isLevelFullyCompleted(levelId, [...completedChapters]);
}

/** 抽题种子（导出供测试断言确定性，不参与渲染） */
export function getCheckpointSeed(levelId: string, attemptNumber: number): number {
  return hashStringToSeed(`${levelId}#checkpoint#${attemptNumber}`);
}

/** 本级核心章（增补章不进入检查点题库） */
export function getCheckpointSourceChapters(level: TheoryLevelInfo): TheoryChapter[] {
  return level.chapters.filter((chapter) => chapter.supplemental !== true);
}

/**
 * 抽取本次检查点题目。
 * 题池 = 核心章小测题目（带来源章元信息）；题池不足 12 题时全量出战，不重复不补空。
 */
export function buildCheckpointQuestions(
  level: TheoryLevelInfo,
  attemptNumber: number,
  size: number = CHECKPOINT_QUESTION_COUNT,
): TheoryCheckpointQuestion[] {
  const pool = getCheckpointSourceChapters(level).flatMap((chapter) =>
    chapter.quiz.map((question) => ({
      question,
      chapterId: chapter.id,
      eloDimension: chapter.eloDimension,
    })),
  );
  if (pool.length === 0) return [];
  const shuffled = shuffleBySeed(pool, getCheckpointSeed(level.id, attemptNumber));
  return shuffled.slice(0, Math.min(Math.max(size, 1), shuffled.length));
}

/** 得分（0–100 四舍五入；空集为 0） */
export function scoreCheckpoint(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

export interface CheckpointDimensionStat {
  dimension: EloDimension;
  correct: number;
  total: number;
}

/** 按来源维度汇总本次作答（结果卡「各维度表现」） */
export function summarizeCheckpointResults(
  questions: readonly TheoryCheckpointQuestion[],
  correctFlags: readonly boolean[],
): CheckpointDimensionStat[] {
  const stats = new Map<EloDimension, CheckpointDimensionStat>();
  questions.forEach((item, index) => {
    const current = stats.get(item.eloDimension) ?? {
      dimension: item.eloDimension,
      correct: 0,
      total: 0,
    };
    stats.set(item.eloDimension, {
      dimension: item.eloDimension,
      correct: current.correct + (correctFlags[index] === true ? 1 : 0),
      total: current.total + 1,
    });
  });
  return [...stats.values()].toSorted((a, b) => b.total - a.total || a.dimension.localeCompare(b.dimension));
}

/** 按来源章归组错题（供 SRS 入队；键为章 id，值为该章错题 id） */
export function groupWrongByChapter(
  questions: readonly TheoryCheckpointQuestion[],
  correctFlags: readonly boolean[],
): { chapterId: string; questionIds: string[] }[] {
  const grouped = new Map<string, string[]>();
  questions.forEach((item, index) => {
    if (correctFlags[index] === true) return;
    grouped.set(item.chapterId, [...(grouped.get(item.chapterId) ?? []), item.question.id]);
  });
  return [...grouped.entries()].map(([chapterId, questionIds]) => ({ chapterId, questionIds }));
}

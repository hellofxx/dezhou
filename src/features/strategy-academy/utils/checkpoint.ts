/**
 * Level Checkpoint 抽题与统计（纯函数，零 store 依赖）。
 *
 * 口径（PRD §5.16.13 / P2）：
 * - 只有**本级核心课全部完成**后开放（门禁由 store `isLevelLessonsCompleted` 判定）；
 * - 从本级已应用题库（`data/lessons/loaders` 合并 L4A+4B、L7 含本土课）抽 12 题，
 *   每题带来源课 lessonId 与 eloDimension（首轮 ELO 归属 + 错题 SRS 回链）；
 * - 抽题走 shared `drawByAttempt`，键 `checkpoint-level-<n>` + 会话种子：
 *   同一次作答题序稳定，重考换种子重新抽题；
 * - 题池不足 12 题时全量出战，不重复不补空；
 * - 检查点**不发证、不解锁下一级**，只记成绩（`checkpoints[level]`）+ 错题 SRS + 首轮 ELO。
 */
import type { EloDimension } from '@/shared/types/elo';
import { drawByAttempt } from '@/shared/utils/academyQuizDraw';
import { getLessonMeta } from '../data/lessonMeta';
import type { CheckpointRecord, Lesson, QuizQuestion } from '../types';
import { orderQuizQuestion } from './quizShuffle';

/** 检查点题量（题池不足时全量） */
export const CHECKPOINT_QUESTION_COUNT = 12;

/** 抽题稳定键前缀（同 Level 共用键，会话种子放在 attemptNumber 位） */
export const CHECKPOINT_DRAW_KEY_PREFIX = 'checkpoint-level-';

export function getCheckpointDrawKey(level: number): string {
  return `${CHECKPOINT_DRAW_KEY_PREFIX}${level}`;
}

/** 本次检查点序号（首次 = 1；仅用于界面展示，抽题用会话种子） */
export function getCheckpointAttemptNumber(
  checkpoints: Readonly<Record<number, CheckpointRecord>> | undefined,
  level: number,
): number {
  return (checkpoints?.[level]?.attempts ?? 0) + 1;
}

/** 是否首轮检查点（决定是否按题更新 ELO / 情绪计数器） */
export function isFirstCheckpointAttempt(
  checkpoints: Readonly<Record<number, CheckpointRecord>> | undefined,
  level: number,
): boolean {
  return (checkpoints?.[level]?.attempts ?? 0) === 0;
}

/** 题目 + 来源课元信息（错题 SRS 路由与 ELO 归属） */
export interface CheckpointQuestion {
  question: QuizQuestion;
  /** 题目来源课 id（错题 SRS 复习项路由到该课） */
  lessonId: string;
  /** 来源课的 ELO 维度（首轮逐题更新 ELO 时使用） */
  eloDimension: EloDimension;
}

/** 题池大小（本级全部课程的已应用题目数） */
export function getCheckpointPoolSize(lessons: readonly Lesson[]): number {
  return lessons.reduce((sum, lesson) => sum + lesson.quiz.length, 0);
}

/** 本次检查点题量 = min(题池, 12) */
export function getCheckpointQuestionCount(lessons: readonly Lesson[]): number {
  return Math.min(getCheckpointPoolSize(lessons), CHECKPOINT_QUESTION_COUNT);
}

/**
 * 抽取本次检查点题目。
 * 1. 题池 = 本级全部课程的已应用测验题（带来源课 lessonId / eloDimension）
 * 2. 按 `checkpoint-level-<n>` + 会话种子抽 12 题（同种子稳定，换种子重抽）
 * 3. 每题用 `会话种子 + index` 派生种子重排选项（correctIndex 同步重映射）
 *
 * 入参课程需已完成渲染层 i18n 解析（`resolveQuizQuestion`），与认证同一条管线。
 */
export function buildCheckpointQuestions(
  lessons: readonly Lesson[],
  level: number,
  sessionSeed: number,
  size: number = CHECKPOINT_QUESTION_COUNT,
): CheckpointQuestion[] {
  const pool: (CheckpointQuestion & { id: string })[] = lessons.flatMap((lesson) => {
    const eloDimension = getLessonMeta(lesson.id).eloDimension;
    return lesson.quiz.map((question) => ({
      id: question.id,
      question,
      lessonId: lesson.id,
      eloDimension,
    }));
  });
  if (pool.length === 0) return [];
  return drawByAttempt(pool, {
    key: getCheckpointDrawKey(level),
    attemptNumber: sessionSeed,
    size,
  }).map(({ question, lessonId, eloDimension }, index) => ({
    question: orderQuizQuestion(question, sessionSeed + index),
    lessonId,
    eloDimension,
  }));
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
  questions: readonly CheckpointQuestion[],
  correctFlags: readonly boolean[],
): CheckpointDimensionStat[] {
  const stats = new Map<EloDimension, CheckpointDimensionStat>();
  for (const [index, item] of questions.entries()) {
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
  }
  return [...stats.values()].toSorted(
    (a, b) => b.total - a.total || a.dimension.localeCompare(b.dimension),
  );
}

/** 按来源课归组错题（供 SRS 入队；键为来源课 id，值为该课错题 id） */
export function groupWrongByLesson(
  questions: readonly CheckpointQuestion[],
  correctFlags: readonly boolean[],
): { lessonId: string; questionIds: string[] }[] {
  const grouped = new Map<string, string[]>();
  for (const [index, item] of questions.entries()) {
    if (correctFlags[index] === true) continue;
    grouped.set(item.lessonId, [...(grouped.get(item.lessonId) ?? []), item.question.id]);
  }
  return [...grouped.entries()].map(([lessonId, questionIds]) => ({ lessonId, questionIds }));
}

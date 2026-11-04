/**
 * Level Checkpoint 纯函数单测（unit / node）。
 *
 * 锁定口径：
 * - 12 题混合测评（题池不足时全量），每题带来源课 lessonId + eloDimension；
 * - 抽题按 `checkpoint-level-<n>` + 会话种子稳定：同种子同结果，换种子换题；
 * - 选项重排后 correctIndex 同步重映射（判分以重排后对象为准）；
 * - 错题按来源课归组 → SRS 复习项 id 命名空间 `checkpoint:l<n>:`、route 回链来源课。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import { getLessonMeta } from '../data/lessonMeta';
import type { Lesson } from '../types';
import {
  CHECKPOINT_QUESTION_COUNT,
  buildCheckpointQuestions,
  getCheckpointAttemptNumber,
  getCheckpointDrawKey,
  getCheckpointQuestionCount,
  groupWrongByLesson,
  isFirstCheckpointAttempt,
  scoreCheckpoint,
  summarizeCheckpointResults,
} from './checkpoint';
import { buildCheckpointReviewItems, checkpointReviewIdPrefix } from './checkpointSrs';

let lessons: Lesson[] = [];

beforeAll(async () => {
  lessons = await loadAcademyLessonsForLevel(1);
});

/** 题池索引：题目 id → 源题（断言选项重排未篡改正确项） */
function poolById(source: readonly Lesson[]): Map<string, { option: string; lessonId: string }> {
  const map = new Map<string, { option: string; lessonId: string }>();
  for (const lesson of source) {
    for (const question of lesson.quiz) {
      map.set(question.id, { option: question.options[question.correctIndex]!, lessonId: lesson.id });
    }
  }
  return map;
}

describe('checkpoint 抽题', () => {
  it('从本级已应用题库抽 12 题且带来源课元信息', () => {
    const questions = buildCheckpointQuestions(lessons, 1, 12345);
    expect(questions).toHaveLength(CHECKPOINT_QUESTION_COUNT);
    expect(new Set(questions.map((item) => item.question.id)).size).toBe(CHECKPOINT_QUESTION_COUNT);

    const pool = poolById(lessons);
    for (const item of questions) {
      const source = pool.get(item.question.id);
      expect(source).toBeDefined();
      expect(item.lessonId).toBe(source!.lessonId);
      expect(item.eloDimension).toBe(getLessonMeta(item.lessonId).eloDimension);
      // 选项重排后正确项文本与源题一致（correctIndex 已重映射）
      expect(item.question.options[item.question.correctIndex]).toBe(source!.option);
    }
  });

  it('同会话种子题序稳定，换种子重新抽题', () => {
    const first = buildCheckpointQuestions(lessons, 1, 777);
    const again = buildCheckpointQuestions(lessons, 1, 777);
    const other = buildCheckpointQuestions(lessons, 1, 888);
    expect(again.map((item) => item.question.id)).toEqual(first.map((item) => item.question.id));
    expect(other.map((item) => item.question.id)).not.toEqual(first.map((item) => item.question.id));
  });

  it('题池不足 12 题时全量出战，不重复不补空', () => {
    const small = lessons.filter((lesson) => lesson.quiz.length > 0).slice(0, 3);
    expect(small).toHaveLength(3);
    const trimmed = small.map((lesson) => ({ ...lesson, quiz: lesson.quiz.slice(0, 1) }));
    const questions = buildCheckpointQuestions(trimmed, 1, 42);
    expect(questions).toHaveLength(3);
    expect(new Set(questions.map((item) => item.question.id))).toEqual(
      new Set(trimmed.map((lesson) => lesson.quiz[0]!.id)),
    );
    expect(getCheckpointQuestionCount(trimmed)).toBe(3);
    expect(getCheckpointQuestionCount(lessons)).toBe(CHECKPOINT_QUESTION_COUNT);
  });

  it('抽题键按 Level 隔离；空题池返回空数组', () => {
    expect(getCheckpointDrawKey(3)).toBe('checkpoint-level-3');
    expect(buildCheckpointQuestions([], 3, 1)).toEqual([]);
  });
});

describe('checkpoint 成绩与统计', () => {
  it('得分四舍五入，空集为 0', () => {
    expect(scoreCheckpoint(12, 12)).toBe(100);
    expect(scoreCheckpoint(9, 12)).toBe(75);
    expect(scoreCheckpoint(1, 3)).toBe(33);
    expect(scoreCheckpoint(0, 0)).toBe(0);
  });

  it('按来源课归组错题，忽略答对题', () => {
    const questions = buildCheckpointQuestions(lessons, 1, 2024);
    const flags = questions.map((_item, index) => index !== 0 && index !== 1);
    const groups = groupWrongByLesson(questions, flags);
    const wrongIds = groups.flatMap((group) => group.questionIds).toSorted();
    expect(wrongIds).toEqual([questions[0]!.question.id, questions[1]!.question.id].toSorted());
    for (const group of groups) {
      const expected = questions
        .filter((item) => item.lessonId === group.lessonId)
        .map((item) => item.question.id)
        .filter((id) => group.questionIds.includes(id));
      expect(group.questionIds).toEqual(expected);
    }
  });

  it('按维度汇总覆盖全部题目', () => {
    const questions = buildCheckpointQuestions(lessons, 1, 99);
    const flags = questions.map((_item, index) => index % 2 === 0);
    const stats = summarizeCheckpointResults(questions, flags);
    expect(stats.reduce((sum, stat) => sum + stat.total, 0)).toBe(questions.length);
    expect(stats.reduce((sum, stat) => sum + stat.correct, 0)).toBe(
      flags.filter(Boolean).length,
    );
  });
});

describe('checkpoint SRS 与尝试序号', () => {
  it('错题复习项回链来源课，id 命名空间按 Level 隔离', () => {
    const questions = buildCheckpointQuestions(lessons, 1, 555);
    const flags = questions.map((_item, index) => index !== 0);
    const items = buildCheckpointReviewItems(1, questions, flags);
    expect(items).toHaveLength(1);

    const wrong = questions[0]!;
    const item = items[0]!;
    expect(item.id).toBe(`${checkpointReviewIdPrefix(1)}${wrong.question.id}`);
    expect(item.id.startsWith('checkpoint:l1:')).toBe(true);
    expect(item.metadata?.route).toBe(`/academy/lesson/${wrong.lessonId}`);
    expect(item.metadata?.source).toBe('strategy');
    // label / front / back 一律存 i18n key（禁止存译文）
    expect(item.label.startsWith('academy.lessonQuiz.')).toBe(true);
    expect(item.metadata?.back?.startsWith('academy.lessonQuiz.')).toBe(true);
  });

  it('全对时无复习项', () => {
    const questions = buildCheckpointQuestions(lessons, 1, 6);
    expect(buildCheckpointReviewItems(1, questions, questions.map(() => true))).toEqual([]);
  });

  it('尝试序号与首轮判定读 checkpoints 记录', () => {
    expect(getCheckpointAttemptNumber(undefined, 1)).toBe(1);
    expect(isFirstCheckpointAttempt(undefined, 1)).toBe(true);
    expect(getCheckpointAttemptNumber({}, 1)).toBe(1);

    const record = {
      1: { attempts: 2, firstScore: 60, bestScore: 80, lastScore: 80, questionIds: [], lastAt: 0 },
    };
    expect(getCheckpointAttemptNumber(record, 1)).toBe(3);
    expect(isFirstCheckpointAttempt(record, 1)).toBe(false);
  });
});

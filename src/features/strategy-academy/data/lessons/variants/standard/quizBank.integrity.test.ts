import { describe, expect, it } from 'vitest';
import { LOCAL_LESSONS } from '../../../localLessons';
import { standardLevels } from './index';
import { LOCAL_QUIZ_BANK, STANDARD_QUIZ_BANK } from './quizBank';

const standardLessons = standardLevels.flatMap((level) => level.lessons);
const lessonById = new Map([...standardLessons, ...LOCAL_LESSONS].map((lesson) => [lesson.id, lesson]));

function checkBank(name: string, bank: Record<string, { id: string; options: string[]; correctIndex: number; explanation: string }[]>) {
  const bad: string[] = [];
  const allIds = new Set<string>();

  for (const [lessonId, questions] of Object.entries(bank)) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) bad.push(`${name}: 未知 lessonId ${lessonId}`);
    if (lesson?.type === 'drill') bad.push(`${name}: Drill 课时不应有题库 ${lessonId}`);
    if (questions.length === 0) continue;
    if (questions.length < 8 || questions.length > 12) {
      bad.push(`${name}/${lessonId}: 题量 ${questions.length} 不在 8-12 区间`);
    }
    for (const question of questions) {
      if (allIds.has(question.id)) bad.push(`${name}: 题 id 重复 ${question.id}`);
      allIds.add(question.id);
      if (question.options.length < 2) bad.push(`${question.id}: 选项不足`);
      if (new Set(question.options).size !== question.options.length) {
        bad.push(`${question.id}: 选项重复`);
      }
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
        bad.push(`${question.id}: correctIndex 越界`);
      }
      if (!question.explanation.trim()) bad.push(`${question.id}: explanation 为空`);
    }
  }

  expect(bad).toEqual([]);
}

describe('strategy quizBank integrity', () => {
  it('标准题库键均为非 Drill 标准课；非空题量 8-12；判分数据合法', () => {
    checkBank('standard', STANDARD_QUIZ_BANK);
  });

  it('本土题库键均为非 Drill 本土课；非空题量 8-12；判分数据合法', () => {
    checkBank('local', LOCAL_QUIZ_BANK);
  });

  it('题库注入后每门非 Drill 标准课仍有题（未迁移课时沿用内联题）', () => {
    const empty = standardLessons
      .filter((lesson) => lesson.type !== 'drill' && lesson.quiz.length === 0)
      .map((lesson) => lesson.id);
    expect(empty).toEqual([]);
  });
});

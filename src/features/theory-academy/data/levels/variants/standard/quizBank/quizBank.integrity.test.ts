import { describe, expect, it } from 'vitest';
import { standardLevels } from '../index';
import { STANDARD_QUIZ_BANK, applyStandardQuizBank } from './index';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../../types';

/**
 * 独立题库守卫：题库注入前后的 id / 排序 / 判分口径一致性。
 *
 * 迁移前题库内联在 level/chapter 文件里，id 与正文同生共死；拆到 quizBank 后，
 * 注入器成为唯一合并点，任何题号重复、章节错配或排序漂移都必须在这里变红。
 */
const chapters = standardLevels.flatMap((level) => level.chapters);
const chapterIds = new Set(chapters.map((chapter) => chapter.id));

describe('quizBank: 题库结构与注入契约', () => {
  it('题库键集合与带题章节集合一致，且每章 8-12 题', () => {
    const bankKeys = Object.keys(STANDARD_QUIZ_BANK).toSorted();
    const chapterKeys = chapters
      .filter((chapter) => chapter.quiz.length > 0)
      .map((chapter) => chapter.id)
      .toSorted();
    expect(bankKeys).toEqual(chapterKeys);
    const bad = Object.entries(STANDARD_QUIZ_BANK)
      .filter(([, quiz]) => quiz.length < 8 || quiz.length > 12)
      .map(([id, quiz]) => `${id}:${quiz.length}`);
    expect(bad).toEqual([]);
  });

  it('题库键必须指向标准变体真实章节（防止拼写错误静默丢题）', () => {
    expect(Object.keys(STANDARD_QUIZ_BANK).filter((id) => !chapterIds.has(id))).toEqual([]);
  });

  it('题 id 为 <chapterId>-q<n>、全局唯一、四选一且判分数据合法', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const [chapterId, quiz] of Object.entries(STANDARD_QUIZ_BANK)) {
      for (const q of quiz) {
        if (!q.id.startsWith(`${chapterId}-q`) || !/^\d+$/.test(q.id.slice(chapterId.length + 2))) {
          bad.push(`${q.id}: id 格式不符`);
        }
        if (seen.has(q.id)) bad.push(`${q.id}: 重复`);
        seen.add(q.id);
        if (q.options.length !== 4) bad.push(`${q.id}: 选项数 ${q.options.length}`);
        if (new Set(q.options).size !== q.options.length) bad.push(`${q.id}: 选项重复`);
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) bad.push(`${q.id}: correctIndex 越界`);
        if (!q.question.trim() || !q.explanation.trim()) bad.push(`${q.id}: 题干或解析为空`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('合并后的章节题序按题号升序排列（注入器排序生效）', () => {
    for (const chapter of chapters) {
      const numbers = chapter.quiz.map((q) => Number(q.id.slice(chapter.id.length + 2)));
      expect(numbers).toEqual(numbers.toSorted((a, b) => a - b));
    }
  });

  it('注入结果与静态合并视图逐题一致（id + 文本，防止注入层改写内容）', () => {
    for (const chapter of chapters) {
      expect(chapter.quiz).toEqual(STANDARD_QUIZ_BANK[chapter.id] ?? []);
    }
  });
});

describe('applyStandardQuizBank: 排序 / 去重 / 校验', () => {
  const chapter: TheoryChapter = {
    ...standardLevels[0]!.chapters[0]!,
    quiz: [],
  };
  const make = (id: string): TheoryQuizQuestion => ({
    id,
    question: id,
    options: ['a', 'b', 'c', 'd'],
    correctIndex: 0,
    explanation: id,
  });

  it('按题号排序并保留章节其余字段', () => {
    const bank = { [chapter.id]: [make(`${chapter.id}-q10`), make(`${chapter.id}-q2`)] };
    const [merged] = applyStandardQuizBank([chapter], bank);
    expect(merged!.quiz.map((q) => q.id)).toEqual([`${chapter.id}-q2`, `${chapter.id}-q10`]);
    expect(merged!.content).toBe(chapter.content);
    expect(merged!.quiz).not.toBe(bank[chapter.id]);
  });

  it('同 id 重复题只保留首条', () => {
    const bank = {
      [chapter.id]: [make(`${chapter.id}-q1`), make(`${chapter.id}-q1`), make(`${chapter.id}-q2`)],
    };
    const [merged] = applyStandardQuizBank([chapter], bank);
    expect(merged!.quiz.map((q) => q.id)).toEqual([`${chapter.id}-q1`, `${chapter.id}-q2`]);
  });

  it('题 id 与章节不匹配时抛错（fail loud，不静默丢题）', () => {
    const bank = { [chapter.id]: [make('wrong-chapter-q1')] };
    expect(() => applyStandardQuizBank([chapter], bank)).toThrow(/题库题 id 非法/);
  });

  it('题库缺省的章节保持原 quiz（空数组占位合法）', () => {
    const [merged] = applyStandardQuizBank([chapter], {});
    expect(merged).toBe(chapter);
  });
});

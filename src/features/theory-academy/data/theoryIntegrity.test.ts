/**
 * 理论学院课程数据完整性守卫测试（复刻 strategy-academy curriculumIntegrity 模式）。
 *
 * 机械校验固化为常驻门禁：ID 唯一性与前缀规范、判分数据合法性、
 * ELO 维度合法性、Level 结构完整性、实践推荐结构合法性。
 * 任何一项失败即测试变红，防止批量生成理论内容时引入结构性缺陷。
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from './levels';
import type { TheoryChapter } from '../types';

const ELO_DIMENSIONS = new Set(['preflop', 'postflop', 'math', 'handReading', 'mental']);
const allChapters: TheoryChapter[] = THEORY_LEVELS.flatMap((level) => level.chapters);

describe('theory integrity: ID 唯一性与前缀规范', () => {
  it('章节 id 全局唯一，且前缀为 t<level>-', () => {
    const seen = new Set<string>();
    const dups = allChapters.filter((c) => (seen.has(c.id) ? true : (seen.add(c.id), false)));
    expect(dups.map((c) => c.id)).toEqual([]);
    const badPrefix = allChapters
      .filter((c) => !c.id.startsWith(`t${c.level}-`))
      .map((c) => c.id);
    expect(badPrefix).toEqual([]);
  });

  it('quiz 题 id 全局唯一，且以所属章节 id 为前缀', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const chapter of allChapters) {
      for (const q of chapter.quiz) {
        if (seen.has(q.id)) bad.push(`${q.id}: 重复`);
        seen.add(q.id);
        if (!q.id.startsWith(`${chapter.id}-`)) bad.push(`${q.id}: 前缀不符`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('Level id 为 t1-t9 且 level 数字连续，章节 order 无重复', () => {
    expect(THEORY_LEVELS.map((l) => l.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => `t${i + 1}`)
    );
    expect(THEORY_LEVELS.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const bad: string[] = [];
    for (const level of THEORY_LEVELS) {
      const orders = level.chapters.map((c) => c.order);
      if (new Set(orders).size !== orders.length) bad.push(`${level.id}: order 重复`);
      if (level.chapters.some((c) => c.level !== level.level)) bad.push(`${level.id}: 章节 level 不一致`);
      if (level.chapters.length === 0) bad.push(`${level.id}: 无章节`);
    }
    expect(bad).toEqual([]);
  });
});

describe('theory integrity: 判分数据合法性', () => {
  it('quiz：correctIndex 界内、选项 ≥2 且无重复、explanation 非空、每章 3-5 题', () => {
    const bad: string[] = [];
    for (const chapter of allChapters) {
      if (chapter.quiz.length < 3 || chapter.quiz.length > 5) {
        bad.push(`${chapter.id}: 题数=${chapter.quiz.length}`);
      }
      for (const q of chapter.quiz) {
        if (q.options.length < 2) bad.push(`${q.id}: 选项不足`);
        if (new Set(q.options).size !== q.options.length) bad.push(`${q.id}: 选项重复`);
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) bad.push(`${q.id}: correctIndex 越界`);
        if (!q.explanation.trim()) bad.push(`${q.id}: explanation 为空`);
        if (!q.question.trim()) bad.push(`${q.id}: question 为空`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('章节内容非空且 eloDimension 合法', () => {
    const bad: string[] = [];
    for (const chapter of allChapters) {
      if (chapter.content.length === 0) bad.push(`${chapter.id}: content 为空`);
      if (!ELO_DIMENSIONS.has(chapter.eloDimension)) bad.push(`${chapter.id}: eloDimension=${chapter.eloDimension}`);
      if (chapter.content.some((s) => !s.content.trim())) bad.push(`${chapter.id}: 存在空段落`);
    }
    expect(bad).toEqual([]);
  });
});

describe('theory integrity: 实践推荐结构合法性', () => {
  it('每个 Level 声明非空 lessons，且 ID 均为 strategy-academy 前缀格式', () => {
    // 引用是否悬空由 strategy-academy/data/curriculumIntegrity.test.ts 的
    // CROSS_MODULE_LESSON_IDS 守卫（事实源：本模块 data/levels/index.ts）
    const bad: string[] = [];
    for (const level of THEORY_LEVELS) {
      const rec = level.practiceRecommendations;
      if (rec.lessons.length === 0) bad.push(`${level.id}: lessons 为空`);
      for (const lesson of rec.lessons) {
        if (!/^l\d/.test(lesson.id)) bad.push(`${level.id} → ${lesson.id}: 非 l<level>- 前缀`);
        if (!lesson.title.trim()) bad.push(`${level.id} → ${lesson.id}: title 为空`);
      }
      if (rec.trackId !== undefined && !rec.trackId.startsWith('track-')) {
        bad.push(`${level.id} → ${rec.trackId}: 非 track- 前缀`);
      }
    }
    expect(bad).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';

/**
 * 单挑策略全量对齐契约守卫（2026-11）。
 *
 * 与理论学院 37 章、标准策略课深度对齐后的可验证下限：
 * - 12 门课，L3–L8 全覆盖，level 内 order 唯一；
 * - 每课 10 题（q1–q5 保留 + q6–q10），4 选项、唯一正确；
 * - 每课 ≥3 个 HandExample、≥4 个 practice 题（l7 保持 5）、≥10 段正文、
 *   ≥2 条 theory-reference、≥2 个手写 units；
 * - 单挑上下文统一 anteStructure='sb_ante'，stackDepth 若声明必须为正；
 * - theory-reference 只指向真实存在的 t*hu-* 章节（跨模块只传 id 字符串）。
 *
 * 题目正确性/数值复算由各 Level 的 quantAudit.l*hu.test.ts 负责；本文件只锁结构契约。
 */

const EXPECTED = [
  ['l3hu-bn-aggression', 3],
  ['l3hu-sb-continuation', 3],
  ['l3hu-bb-defense', 3],
  ['l4hu-bn-opening', 4],
  ['l4hu-ev-adjustments', 4],
  ['l4hu-gto-basics', 4],
  ['l4hu-counter-strategies', 4],
  ['l5hu-focus', 5],
  ['l5hu-opponent-psychology', 5],
  ['l6hu-tourney', 6],
  ['l7hu-stakes', 7],
  ['l8hu-exploitative', 8],
] as const;

const theorySources = import.meta.glob<string>(
  '../../../../../theory-academy/data/levels/variants/heads-up/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

function readHeadsUpChapterIds(): Set<string> {
  const ids = new Set<string>();
  for (const [file, src] of Object.entries(theorySources)) {
    if (file.endsWith('.test.ts')) continue;
    for (const m of src.matchAll(/id: '(t\d+hu-[a-z0-9-]+)'/g)) {
      const id = m[1];
      if (id && !/-q\d+$/.test(id)) ids.add(id);
    }
  }
  return ids;
}

const CHAPTER_IDS = readHeadsUpChapterIds();

describe('单挑策略全量对齐契约', () => {
  const lessons = HEADS_UP_STRATEGY_COURSES;

  it('12 门课齐全、level 与顺序与阶梯一致', () => {
    expect(lessons.map((lesson) => [lesson.id, lesson.level])).toEqual(EXPECTED);
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(12);
  });

  it('理论章节扫描自检（防 glob 失配导致锚点空断言）', () => {
    expect(Object.keys(theorySources).length).toBeGreaterThan(10);
    expect(CHAPTER_IDS.size).toBeGreaterThanOrEqual(37);
    expect(CHAPTER_IDS.has('t5hu-node-locking')).toBe(true);
  });

  it('level 内 order 唯一且连续从 1 开始', () => {
    const byLevel = new Map<number, number[]>();
    for (const lesson of lessons) {
      const orders = byLevel.get(lesson.level) ?? [];
      orders.push(lesson.order);
      byLevel.set(lesson.level, orders);
    }
    for (const [level, orders] of byLevel) {
      expect(orders.toSorted((a, b) => a - b), `L${level} order`).toEqual(
        orders.map((_, index) => index + 1),
      );
    }
  });

  it('每课结构达到对齐下限（题库 / 牌例 / practice / 正文 / 理论引用 / units）', () => {
    const bad: string[] = [];
    for (const lesson of lessons) {
      if (lesson.quiz.length !== 10) bad.push(`${lesson.id}: quiz=${lesson.quiz.length}`);
      if ((lesson.examples?.length ?? 0) < 3) bad.push(`${lesson.id}: examples<3`);
      const minPractice = lesson.id === 'l7hu-stakes' ? 5 : 4;
      if ((lesson.practice?.questions.length ?? 0) < minPractice) {
        bad.push(`${lesson.id}: practice<${minPractice}`);
      }
      if (lesson.content.length < 10) bad.push(`${lesson.id}: content<10`);
      const theoryRefs = lesson.content.filter((section) => section.type === 'theory-reference');
      if (theoryRefs.length < 2) bad.push(`${lesson.id}: theory-reference<2`);
      if (!lesson.content.some((section) => section.type === 'takeaway')) {
        bad.push(`${lesson.id}: without takeaway`);
      }
      if ((lesson.units?.length ?? 0) < 2) bad.push(`${lesson.id}: units<2`);
      if (lesson.variantContext?.anteStructure !== 'sb_ante') {
        bad.push(`${lesson.id}: variantContext.anteStructure`);
      }
      if (lesson.variantContext?.stackDepth !== undefined && lesson.variantContext.stackDepth <= 0) {
        bad.push(`${lesson.id}: stackDepth<=0`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('q1–q5 保留（SRS 兼容），全部题目四选一且 id 唯一', () => {
    const allIds: string[] = [];
    const bad: string[] = [];
    for (const lesson of lessons) {
      for (let index = 1; index <= 5; index += 1) {
        const id = `${lesson.id}-q${index}`;
        if (!lesson.quiz.some((question) => question.id === id)) {
          bad.push(`${lesson.id}: 缺少保留题 q${index}`);
        }
      }
      for (const question of lesson.quiz) {
        allIds.push(question.id);
        if (question.options.length !== 4) bad.push(`${question.id}: options=${question.options.length}`);
        if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
          bad.push(`${question.id}: correctIndex 越界`);
        }
        if (!question.explanation.trim()) bad.push(`${question.id}: explanation 为空`);
      }
      for (const example of lesson.examples ?? []) allIds.push(example.id);
      for (const question of lesson.practice?.questions ?? []) allIds.push(question.id);
    }
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    expect({ bad, duplicates: [...new Set(duplicates)] }).toEqual({ bad: [], duplicates: [] });
  });

  it('每条 theory-reference 都指向真实存在的单挑章节', () => {
    const dangling: string[] = [];
    for (const lesson of lessons) {
      for (const section of lesson.content) {
        if (section.type !== 'theory-reference') continue;
        const chapterId = section.data?.theoryChapterId;
        if (typeof chapterId !== 'string' || !CHAPTER_IDS.has(chapterId)) {
          dangling.push(`${lesson.id} → ${String(chapterId)}`);
        }
      }
    }
    expect(dangling).toEqual([]);
  });

  it('units 的 section 必须是 content 中同一对象的引用', () => {
    const bad: string[] = [];
    for (const lesson of lessons) {
      for (const unit of lesson.units ?? []) {
        for (const section of unit.sections) {
          if (!lesson.content.includes(section)) bad.push(`${lesson.id}/${unit.id}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});

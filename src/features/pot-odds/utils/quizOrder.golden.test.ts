/**
 * pot-odds 选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：全题库 19 题（本题库就是治理样本全集），覆盖两条路径：
 *  - key 路径：不传 resolvedTexts → 一律按 id 种子洗牌；
 *  - 解析路径：传 t() 解析后文本 → 数值题（id 2/6/11）走升序，其余走洗牌。
 *
 * 断言口径 `[原索引置换, correctIndex]`：与 i18n 文案、选项 key 名解耦，
 * 只锁定"哪个原选项排在哪个位置"与"正确项落在哪一位"。迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from './quizOrder';

/** 数值题（outs 计算）在 zh locale 下的真实解析文本（与 locales/zh/potOdds.json 同步） */
const NUMERIC_QUESTION_TEXTS: Record<number, string[]> = {
  2: ['8 个（两头顺）', '9 个（同花听牌）', '约 15 个（组合听牌）', '4 个（卡顺）'],
  6: ['9 个（仅同花）', '约 15 个', '6 个（仅高牌）', '12 个'],
  11: ['17 个（直接相加）', '约 15 个', '8 个', '9 个'],
};

/** id → [key 路径置换, key 路径 correctIndex, 解析路径置换, 解析路径 correctIndex] */
const GOLDEN: ReadonlyArray<readonly [number, number[], number, number[], number]> = [
  [1, [0, 1], 0, [0, 1], 0],
  [2, [3, 0, 1, 2], 3, [3, 0, 1, 2], 3],
  [3, [0, 1], 0, [0, 1], 0],
  [4, [1, 0], 1, [1, 0], 1],
  [5, [1, 0], 0, [1, 0], 0],
  [6, [1, 2, 3, 0], 0, [2, 0, 3, 1], 3],
  [7, [0, 1], 0, [0, 1], 0],
  [8, [0, 1], 0, [0, 1], 0],
  [9, [1, 0], 1, [1, 0], 1],
  [10, [0, 1], 0, [0, 1], 0],
  [11, [0, 3, 2, 1], 3, [2, 3, 1, 0], 2],
  [12, [1, 0], 1, [1, 0], 1],
  [13, [0, 1], 0, [0, 1], 0],
  [14, [0, 1], 0, [0, 1], 0],
  [15, [0, 1], 1, [0, 1], 1],
  [16, [0, 1], 0, [0, 1], 0],
  [17, [0, 1], 1, [0, 1], 1],
  [18, [0, 1], 1, [0, 1], 1],
  [19, [1, 0], 1, [1, 0], 1],
];

/** 重排后数组相对原数组的索引置换 */
function perm<T>(original: readonly T[], ordered: readonly T[]): number[] {
  return ordered.map((item) => original.indexOf(item));
}

describe('pot-odds orderQuizOptions 黄金快照', () => {
  it('key 路径（无 resolvedTexts）：选项置换与正确答案位置不变', () => {
    for (const [id, order, correctIndex] of GOLDEN) {
      const source = QUIZ_QUESTIONS.find((q) => q.id === id);
      expect(source, `题目 ${id} 不存在`).toBeDefined();
      const ordered = orderQuizOptions(source!);
      expect(perm(source!.options, ordered.options), `题目 ${id} 选项顺序漂移`).toEqual(order);
      expect(
        ordered.options.findIndex((o) => o.isCorrect),
        `题目 ${id} 正确答案位置漂移`,
      ).toBe(correctIndex);
    }
  });

  it('解析路径（传 t() 解析文本）：选项置换与正确答案位置不变', () => {
    for (const [id, , , order, correctIndex] of GOLDEN) {
      const source = QUIZ_QUESTIONS.find((q) => q.id === id)!;
      const numeric = NUMERIC_QUESTION_TEXTS[id];
      const resolvedTexts = numeric ?? source.options.map(() => '非数值选项文本占位');
      const ordered = orderQuizOptions(source, undefined, resolvedTexts);
      expect(perm(source.options, ordered.options), `题目 ${id} 选项顺序漂移`).toEqual(order);
      expect(
        ordered.options.findIndex((o) => o.isCorrect),
        `题目 ${id} 正确答案位置漂移`,
      ).toBe(correctIndex);
    }
  });
});

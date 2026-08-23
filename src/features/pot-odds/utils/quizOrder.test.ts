import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from './quizOrder';
import type { PotOddsQuizQuestion } from '../types';

/**
 * 赔率测验题库选项排序测试（答案位置偏差治理守卫）。
 *
 * 背景：原 14 题正确答案高度集中于 options[0]（10/14 = 71.4%），
 * 且 11 道二选一题中 10 道的正确答案是"是/跟注有利"式肯定项。
 * 治理：扩充 5 道否定项平衡题（id 15-19）+ orderQuizOptions 统一排序
 * （数值选项升序、其余按题目 id 种子确定性洗牌）。
 *
 * 排序分两条路径：
 *  - key 路径（不传 resolvedTexts）：一律洗牌（getEasyOddsQuestion 等纯洗牌场景）；
 *  - 解析路径（传 t() 解析后文本）：数值题（outs 计算）走升序分支——
 *    页面真实行为（PotOddsQuizPage 渲染期排序）。
 * 历史缺陷（本轮修复）：旧测试在 key 路径上断言"数值题升序"，
 * 从 key（potOdds.quizBank.qN.optX.text）提取数字时所有选项都提取出题号 N，
 * 断言平凡通过，未发现"数值升序分支从未生效"的真实缺陷。
 */

// 数值题（outs 计算）在 zh/en locale 下的真实选项文本
// （与 locales/{zh,en}/potOdds.json 的 quizBank.qN.optX.text 保持同步）。
const NUMERIC_QUESTION_TEXTS: Record<number, { zh: string[]; en: string[] }> = {
  2: {
    zh: ['8 个（两头顺）', '9 个（同花听牌）', '约 15 个（组合听牌）', '4 个（卡顺）'],
    en: ['8 (open-ended straight)', '9 (flush draw)', 'About 15 (combo draw)', '4 (gutshot)'],
  },
  6: {
    zh: ['9 个（仅同花）', '约 15 个', '6 个（仅高牌）', '12 个'],
    en: ['9 (flush only)', 'About 15', '6 (overcards only)', '12'],
  },
  11: {
    zh: ['17 个（直接相加）', '约 15 个', '8 个', '9 个'],
    en: ['17 (straight addition)', 'About 15', '8', '9'],
  },
};

const NUMERIC_IDS = [2, 6, 11];

/** 模拟页面渲染期排序：数值题传真实解析文本（触发升序分支），其余题传非数值占位文本（走洗牌） */
function orderWithResolvedTexts(
  q: PotOddsQuizQuestion,
  lang: 'zh' | 'en',
): PotOddsQuizQuestion {
  const numeric = NUMERIC_QUESTION_TEXTS[q.id];
  const resolvedTexts = numeric ? numeric[lang] : q.options.map(() => '非数值选项文本占位');
  return orderQuizOptions(q, undefined, resolvedTexts);
}

describe('pot-odds 题库选项排序（quizOrder）', () => {
  it('题库共 19 题（14 原题 + 5 平衡题）', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(19);
    expect(QUIZ_QUESTIONS.map((q) => q.id)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1),
    );
  });

  describe('key 路径（不传 resolvedTexts）：一律确定性洗牌', () => {
    const ordered = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));

    it('确定性：两次处理结果完全一致', () => {
      const again = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));
      expect(again).toEqual(ordered);
    });

    it('排序不丢失选项：每题选项文本集合与原始一致', () => {
      const originalById = new Map(
        QUIZ_QUESTIONS.map((q) => [q.id, [...q.options.map((o) => o.text)].sort()]),
      );
      for (const q of ordered) {
        const texts = [...q.options.map((o) => o.text)].sort();
        expect(texts, `题目 ${q.id} 选项集合不一致`).toEqual(originalById.get(q.id));
      }
    });

    it('每题恰有 1 个正确选项', () => {
      for (const q of ordered) {
        const correct = q.options.filter((o) => o.isCorrect);
        expect(correct, `题目 ${q.id} 正确选项数量异常`).toHaveLength(1);
      }
    });

    it('key 含题号数字也不会误入升序分支：二选一题不保持原序（防作弊治理生效）', () => {
      // 若 key 被误判为数值集，sortByNumericValue 会按 key 中的题号数字排序——
      // 所有选项数字相同 → 稳定排序保持原序。断言至少一题发生了真实洗牌。
      const shuffled = ordered.filter((q, i) => {
        const original = QUIZ_QUESTIONS[i]!;
        return q.options[0]!.text !== original.options[0]!.text;
      });
      expect(shuffled.length).toBeGreaterThan(0);
    });
  });

  describe('解析路径（传 t() 解析后文本）：页面真实行为', () => {
    const orderedZh = QUIZ_QUESTIONS.map((q) => orderWithResolvedTexts(q, 'zh'));
    const orderedEn = QUIZ_QUESTIONS.map((q) => orderWithResolvedTexts(q, 'en'));

    it('数值选项题（id 2/6/11）走升序分支：各选项数字严格递增且互不相同', () => {
      for (const id of NUMERIC_IDS) {
        const q = orderedZh.find((item) => item.id === id);
        expect(q, `题目 ${id} 不存在`).toBeDefined();
        // 重排后 option.text 仍是 i18n key，经 key 反查解析文本来取数值
        const source = QUIZ_QUESTIONS.find((item) => item.id === id)!;
        const texts = NUMERIC_QUESTION_TEXTS[id]!.zh;
        const textByKey = new Map(source.options.map((o, i) => [o.text, texts[i]!]));
        const values = q!.options.map((o) => {
          const resolved = textByKey.get(o.text);
          expect(resolved, `题目 ${id} 选项「${o.text}」无法反查解析文本`).toBeDefined();
          const match = /\d+(?:\.\d+)?/.exec(resolved!);
          expect(match, `题目 ${id} 解析文本「${resolved}」无数字`).not.toBeNull();
          return parseFloat(match![0]);
        });
        // 互不相同：防止旧缺陷的"全部选项提取出相同数字"平凡通过
        expect(new Set(values).size, `题目 ${id} 选项数值存在重复`).toBe(values.length);
        for (let i = 1; i < values.length; i++) {
          expect(values[i], `题目 ${id} 选项未按数值升序`).toBeGreaterThan(values[i - 1]!);
        }
      }
    });

    it('正确答案索引随重排同步重映射（isCorrect 跟随选项对象移动）', () => {
      for (const id of NUMERIC_IDS) {
        const source = QUIZ_QUESTIONS.find((q) => q.id === id)!;
        const correctText = source.options.find((o) => o.isCorrect)!.text;
        const ordered = orderedZh.find((q) => q.id === id)!;
        const correct = ordered.options.filter((o) => o.isCorrect);
        expect(correct, `题目 ${id} 重排后正确选项数量异常`).toHaveLength(1);
        expect(correct[0]!.text, `题目 ${id} 正确答案标识未跟随移动`).toBe(correctText);
      }
    });

    it('语言无关：zh 与 en 解析文本下每题选项 key 顺序完全一致', () => {
      for (let i = 0; i < orderedZh.length; i++) {
        const zhKeys = orderedZh[i]!.options.map((o) => o.text);
        const enKeys = orderedEn[i]!.options.map((o) => o.text);
        expect(enKeys, `题目 ${orderedZh[i]!.id} zh/en 顺序不一致`).toEqual(zhKeys);
      }
    });

    it('处理后正确答案索引分布：任一索引占比 < 60%', () => {
      const counts = new Map<number, number>();
      for (const q of orderedZh) {
        const idx = q.options.findIndex((o) => o.isCorrect);
        expect(idx, `题目 ${q.id} 未找到正确选项`).toBeGreaterThanOrEqual(0);
        counts.set(idx, (counts.get(idx) ?? 0) + 1);
      }
      const distribution = [...counts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([idx, n]) => `索引${idx}: ${n} 题 (${((n / orderedZh.length) * 100).toFixed(1)}%)`)
        .join(', ');
      // 输出实测分布，便于报告核对
      console.log(`[pot-odds 排序分布·解析路径] 共 ${orderedZh.length} 题 → ${distribution}`);
      for (const [idx, n] of counts) {
        expect(n / orderedZh.length, `索引 ${idx} 占比过高`).toBeLessThan(0.6);
      }
    });

    it('排序不丢失选项：每题选项文本集合与原始一致', () => {
      const originalById = new Map(
        QUIZ_QUESTIONS.map((q) => [q.id, [...q.options.map((o) => o.text)].sort()]),
      );
      for (const q of orderedZh) {
        const texts = [...q.options.map((o) => o.text)].sort();
        expect(texts, `题目 ${q.id} 选项集合不一致`).toEqual(originalById.get(q.id));
      }
    });

    it('每题恰有 1 个正确选项', () => {
      for (const q of orderedZh) {
        const correct = q.options.filter((o) => o.isCorrect);
        expect(correct, `题目 ${q.id} 正确选项数量异常`).toHaveLength(1);
      }
    });
  });

  it('内容平衡：否定项平衡题（balanceQuestion 标记）≥ 5', () => {
    // i18n 化后选项文本为 key（potOdds.quizBank.qN.optX.text），无法再从文本判语义。
    // 平衡题语义由数据层的 balanceQuestion 标记显式声明（id 15-19，正确答案为弃牌/不跟注否定项）。
    const balanceQuestions = QUIZ_QUESTIONS.filter((q) => q.balanceQuestion === true);
    expect(balanceQuestions.length).toBeGreaterThanOrEqual(5);
    // 每题正确答案存在且为 1 个（平衡题仍是有效题）
    for (const q of balanceQuestions) {
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `平衡题 ${q.id} 正确选项数量异常`).toHaveLength(1);
    }
  });
});

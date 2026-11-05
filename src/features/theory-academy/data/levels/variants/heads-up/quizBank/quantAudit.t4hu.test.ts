import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { calculateAlpha, calculateMDF, requiredEquity } from '../../../../../utils/theoryFormulas';
import { HEADS_UP_LEVEL_4 } from '../headsUpLevel4';
import { HEADS_UP_CHAPTERS as RANGE_ADVANTAGE } from '../chapters/t4hu-range-advantage';
import { HEADS_UP_CHAPTERS as PREFLOP_STRUCTURE } from '../chapters/t4hu-preflop-structure';
import { CONTENT_BLOCKS } from '../blocks/t4hu';
import { QUIZ_BANK } from './t4hu';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../../types';

/**
 * T4HU（T4 内容轨）量化断言审计。
 *
 * 职责与 `variants/variantQuantAudit.test.ts` 同源：
 * 1. 新增题里的数值题按统一口径**重新计算**，再断言正确选项文本与复算结果一致
 *    （题面数字、correctIndex、选项文本任一漂移即红）；
 * 2. 正文散文数值以文件头「人工复核索引」登记，配少量锚点断言防漂移。
 *
 * 口径（与 theoryFormulas 单源）：MDF = P/(P+b)、Alpha = b/(P+b)、
 * 跟注所需权益 = 需补入额 ÷ 跟注后底池、组合计数 C(n,2) = n(n−1)/2、
 * 价值:诈唬比 = 1/b + 1（b = 下注额/底池）。
 *
 * ================= 人工复核索引（0 起、含 heading 段） =================
 * [正确] t4hu-range-advantage idx4：1/3 池 MDF = 4÷(4+4/3) = 75%；2/3 池 Alpha = (8/3)÷(4+8/3) = 40%
 * [正确] t4hu-range-advantage idx5：A♠7♦2♣ 上三条 C(3,2)=3，SB 覆盖 AA/77/22 = 9 个；
 *        BB 跟注范围只剩 77/22 = 6 个（AA 多进 3-bet 范围）
 * [正确] t4hu-range-advantage idx7：8♠7♦6♣ 成顺连张 T9/95/54 各 4×4=16 个，合计 48 个；坚果顺子由 T9 做成
 * [正确] t4hu-range-advantage idx10（块）：牌面归属表为定性归属，无可复算数值
 * [正确] t4hu-preflop-structure idx2：BB 跟 min-raise 1÷4 = 25%；BB 3-bet 到 6BB Alpha = 5÷8 = 62.5%
 *        （SB 需防 37.5%）；SB 4-bet 到 15BB Alpha = 13÷21 ≈ 61.9%（BB 需防 38.1%）；
 *        BB 跟 4-bet 9÷30 = 30%
 * [正确] t4hu-preflop-structure idx4：0.30 ÷ 0.85 ≈ 35.3%，与 25% 相差约 10.3 个百分点（正文写「整整 10 个百分点」）
 * [正确] t4hu-preflop-structure idx5：3-bet 18% ≈ 239 个组合（1326×0.18），价值端 12% ≈ 159 个、诈唬端 6% ≈ 80 个，159+80=239，价值:诈唬 ≈ 2:1
 * [示意值] t4hu-preflop-structure idx4：0.85 的权益实现率是经验口径（与短牌侧 t6sd-equity-realization 同一处置），
 *        正文已标「示意口径」，倒推结论随该值线性移动，禁止当精确值引用
 * [正确] t4hu-preflop-structure idx9（块）：四节点账本与 idx2 逐行同值
 * [正确] t4hu-range-width idx11（块）：参与率 ~80%、防守 ~60%、1÷4 = 25%、5÷8 = 62.5%、1−62.5% = 37.5%
 * [正确] t4hu-polarization idx11（块）：b=1/3 → 价值:诈唬 4:1、Alpha 25.0%；b=1/2 → 3:1、33.3%；
 *        b=1 → 2:1、50.0%；b=2 → 3:2、66.7%（价值:诈唬 = 1/b + 1）
 * [正确] t4hu-blocking idx11（块）：三黑桃面持 A♠ → 对手坚果同花 10 → 0；不持 A♠ 仍 10；
 *        两黑桃面 C(11,2)=55 → C(10,2)=45；持一张 K 使 KK 由 C(4,2)=6 降到 C(3,2)=3
 * [示意值] t4hu-range-wide 相关既有段（0.5 死钱让对手白拿、K6s 46%-48% 等）沿用历史结论，
 *        本轨未改动既有正文，故不在本文件重复登记（见 variantQuantAudit 索引）
 * ==========================================================================
 */

const CHAPTERS: TheoryChapter[] = [
  ...HEADS_UP_LEVEL_4.chapters,
  ...RANGE_ADVANTAGE,
  ...PREFLOP_STRUCTURE,
];

const contentOf = (chapterId: string): string[] => {
  const chapter = CHAPTERS.find((candidate) => candidate.id === chapterId);
  expect(chapter, `章节 ${chapterId} 存在`).toBeDefined();
  return (chapter as TheoryChapter).content.map((section) => section.content);
};

const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
  const question = (QUIZ_BANK[chapterId] ?? []).find((candidate) => candidate.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question as TheoryQuizQuestion;
};

const expectAnswerIs = (chapterId: string, questionId: string, answer: string): void => {
  const question = getQuiz(chapterId, questionId);
  expect(question.options[question.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
};

/** 复算值取到十分位百分比，与正文「约 xx.x%」的书写精度一致 */
const pct = (x: number): number => Math.round(x * 1000) / 10;

const zhLocale = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../../../../../../i18n/locales/zh/theory-content/t4hu.json', import.meta.url),
    ),
    'utf8',
  ),
) as { content: Record<string, string[]>; quiz: Record<string, unknown> };

describe('T4HU 量化审计：范围优势与坚果优势', () => {
  it('高张干燥面：MDF 75% / Alpha 40% 与 9 比 6 的三条组合', () => {
    expect(calculateMDF(4, 4 / 3)).toBeCloseTo(0.75, 10);
    expect(calculateAlpha(4, 8 / 3)).toBeCloseTo(0.4, 10);
    // 三条组合 C(3,2)：AA / 77 / 22 各 3 个 → SB 9 个；BB 无 AA → 6 个
    expect((3 * 2) / 2).toBe(3);
    expect(3 * 3).toBe(9);
    expect(3 * 2).toBe(6);
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q3', 'SB 9 个、BB 6 个');
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q5', '75%');
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q6', '40%');
    // 正文锚点：三条 9 / 6 与两个尺度值不得漂移
    expect(contentOf('t4hu-range-advantage')[5]).toContain('9 个组合');
    expect(contentOf('t4hu-range-advantage')[5]).toContain('6 个');
    expect(contentOf('t4hu-range-advantage')[4]).toContain('75%');
    expect(contentOf('t4hu-range-advantage')[4]).toContain('40%');
  });

  it('低连面：三组连张各 4×4 = 16 个，合计 48 个', () => {
    expect(4 * 4).toBe(16);
    expect(16 * 3).toBe(48);
    expect(contentOf('t4hu-range-advantage')[7]).toContain('48 个');
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q4', 'BB，因为他的防守范围连张密度更高');
  });

  it('q1/q2 为定义题：范围优势看总量、坚果优势看顶端', () => {
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q1', '整个范围的权益总量高于对手');
    expectAnswerIs('t4hu-range-advantage', 't4hu-range-advantage-q2', '范围里最强那一档手牌的组合数更多');
  });
});

describe('T4HU 量化审计：翻前 3-bet 与 4-bet 价格线', () => {
  it('四节点价格：25% / 62.5% / 61.9% / 30%', () => {
    // BB 跟 min-raise：再投 1 → 总池 4
    expect(requiredEquity(1, 4)).toBe(0.25);
    // BB 3-bet 到 6：多投 5，赢 3（SB 2 + 自己 1）
    expect(calculateAlpha(3, 5)).toBeCloseTo(0.625, 10);
    expect(1 - calculateAlpha(3, 5)).toBeCloseTo(0.375, 10);
    // SB 4-bet 到 15：多投 13，赢 8（BB 6 + SB 2）
    expect(pct(calculateAlpha(8, 13))).toBe(61.9);
    expect(pct(1 - calculateAlpha(8, 13))).toBe(38.1);
    // BB 跟 4-bet：再投 9 → 总池 30
    expect(requiredEquity(9, 30)).toBe(0.3);
    const formula = contentOf('t4hu-preflop-structure')[2] as string;
    for (const anchor of ['25%', '62.5%', '61.9%', '30%']) expect(formula).toContain(anchor);
  });

  it('实现率折算：30% ÷ 0.85 ≈ 35.3%，与 25% 相差约 10 个百分点', () => {
    expect(pct(requiredEquity(9, 30) / 0.85)).toBe(35.3);
    expect(pct(requiredEquity(9, 30) / 0.85 - requiredEquity(1, 4))).toBe(10.3);
    expect(contentOf('t4hu-preflop-structure')[4]).toContain('35.3%');
    // 3-bet 组合账：239 = 159 价值 + 80 诈唬
    expect(Math.round(1326 * 0.18)).toBe(239);
    expect(Math.round(1326 * 0.12)).toBe(159);
    expect(Math.round(1326 * 0.06)).toBe(80);
    expect(159 + 80).toBe(239);
    expect(contentOf('t4hu-preflop-structure')[5]).toContain('239 个');
    expectAnswerIs('t4hu-preflop-structure', 't4hu-preflop-structure-q1', '25%');
    expectAnswerIs('t4hu-preflop-structure', 't4hu-preflop-structure-q2', '62.5%');
    expectAnswerIs('t4hu-preflop-structure', 't4hu-preflop-structure-q3', '37.5%');
    expectAnswerIs('t4hu-preflop-structure', 't4hu-preflop-structure-q4', '30%');
  });

  it('块表四行与公式段同值（禁止块与正文各写一套）', () => {
    const block = CONTENT_BLOCKS['t4hu-preflop-structure']?.[0];
    expect(block?.data?.kind).toBe('table');
    const rows = block?.data?.kind === 'table' ? (block.data.rows as string[][]) : [];
    expect(rows.map((row) => row[3])).toEqual([
      '25% equity',
      '62.5% fold',
      '61.9% fold',
      '30% equity',
    ]);
  });
});

describe('T4HU 量化审计：既有章新增题（q6-q8）的数值', () => {
  it('t4hu-range-width-q8：1326 × 0.8 ≈ 1060 个组合', () => {
    expect(Math.round(1326 * 0.8)).toBe(1061);
    expect(1326 * 0.8).toBeGreaterThan(1060);
    expect(1326 * 0.8).toBeLessThan(1061);
    expectAnswerIs('t4hu-range-width', 't4hu-range-width-q8', '约 1060 个');
  });

  it('t4hu-polarization：半池 3:1 与满池 12BB 诈唬在 50% 弃牌下的 EV = 0', () => {
    // 价值:诈唬 = 1/b + 1 → b=0.5 → 3:1
    expect(1 / 0.5 + 1).toBe(3);
    expectAnswerIs('t4hu-polarization', 't4hu-polarization-q6', '3:1');
    const bluffEv = 0.5 * 12 - 0.5 * 12;
    expect(bluffEv).toBe(0);
    expectAnswerIs('t4hu-polarization', 't4hu-polarization-q8', '0BB');
  });

  it('t4hu-blocking：两黑桃面 55 → 45（约少 18%）、持 K 时 KK 6 → 3', () => {
    expect((11 * 10) / 2).toBe(55);
    expect((10 * 9) / 2).toBe(45);
    expect(Math.round((1 - 45 / 55) * 100)).toBe(18);
    expectAnswerIs('t4hu-blocking', 't4hu-blocking-q6', '从 55 个降到 45 个，约少 18%');
    expect((4 * 3) / 2).toBe(6);
    expect((3 * 2) / 2).toBe(3);
    expectAnswerIs('t4hu-blocking', 't4hu-blocking-q8', '由 6 变为 3');
  });
});

describe('T4HU 内容轨：数据 ↔ zh locale 追加对齐', () => {
  it('每章 zh 正文前缀与数据逐字一致，块文本追加在尾部', () => {
    for (const chapter of CHAPTERS) {
      const locale = zhLocale.content[chapter.id];
      expect(locale, `${chapter.id} 在 zh locale 中缺失`).toBeDefined();
      const blocks = CONTENT_BLOCKS[chapter.id] ?? [];
      expect(locale!.length, `${chapter.id} 正文条数`).toBe(chapter.content.length + blocks.length);
      chapter.content.forEach((section, index) => {
        expect(locale![index], `${chapter.id} content[${index}] 应与数据逐字一致`).toBe(
          section.content,
        );
      });
      blocks.forEach((section, offset) => {
        expect(locale![chapter.content.length + offset]).toBe(section.content);
      });
    }
  });

  it('题库每章的 zh 题面与选项逐字镜像，且每章 8 题', () => {
    for (const chapter of CHAPTERS) {
      const bank = QUIZ_BANK[chapter.id] ?? [];
      expect(bank.length, `${chapter.id} 题数`).toBe(8);
      bank.forEach((question) => {
        const locale = zhLocale.quiz[question.id] as
          | { question: string; options: string[]; explanation: string }
          | undefined;
        expect(locale, `${question.id} 在 zh locale 中缺失`).toBeDefined();
        expect(locale!.question).toBe(question.question);
        expect(locale!.options).toEqual(question.options);
        expect(locale!.explanation).toBe(question.explanation);
      });
    }
  });
});

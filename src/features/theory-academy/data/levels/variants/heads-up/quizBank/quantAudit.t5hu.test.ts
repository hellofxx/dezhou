import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { calculateAlpha, calculateMDF, requiredEquity } from '../../../../../utils/theoryFormulas';
import { HEADS_UP_LEVEL_5 } from '../headsUpLevel5';
import { HEADS_UP_CHAPTERS as NODE_LOCKING } from '../chapters/t5hu-node-locking';
import { HEADS_UP_CHAPTERS as PREFLOP_EQ } from '../chapters/t5hu-preflop-equilibrium';
import { HEADS_UP_CHAPTERS as POSTFLOP_EQ } from '../chapters/t5hu-postflop-equilibrium';
import { CONTENT_BLOCKS } from '../blocks/t5hu';
import { QUIZ_BANK } from './t5hu';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../../types';

/**
 * T5HU（T5 内容轨）量化断言审计。
 *
 * 职责与 `variants/variantQuantAudit.test.ts` 同源：
 * 1. 新增题里的数值题按统一口径**重新计算**，再断言正确选项文本与复算结果一致；
 * 2. 正文散文数值以文件头「人工复核索引」登记，配少量锚点断言防漂移。
 *
 * 口径（与 theoryFormulas 单源）：MDF = P/(P+b)、Alpha = b/(P+b)、
 * 跟注所需权益 = 需补入额 ÷ 跟注后底池、纯诈唬 EV = f×P − (1−f)×B、
 * SPR = 剩余筹码 ÷ 底池、三街几何尺度 x = ((1+2·SPR)^(1/3) − 1)/2。
 *
 * ================= 人工复核索引（0 起、含 heading 段） =================
 * [正确] t5hu-node-locking idx3：1/3 池 Alpha = (4/3)÷(4+4/3) = 25%；
 *        EV(f=40%)=0.4×4−0.6×1.33=+0.80；EV(50%)=+1.34；EV(60%)=+1.87
 * [正确] t5hu-node-locking idx4/idx5：均衡弃牌率 25% 处 EV = 0；对手从 60% 收到 40% 仍 +0.80，
 *        收到 25% 才归零（偏离上限 = 让 EV 归零的频率）
 * [正确] t5hu-node-locking idx10（块）：f=15% → −0.53、25% → 0、40% → +0.80、50% → +1.34、60% → +1.87
 * [正确] t5hu-preflop-equilibrium idx3：limp 后 BB 加注 Alpha = 1÷2.5 = 40%；min-raise 后 BB 1÷4 = 25%；
 *        3-bet 到 6BB Alpha = 5÷8 = 62.5%（SB 需防 37.5% = 8% 4-bet + 29.5% 跟注）
 * [正确] t5hu-preflop-equilibrium idx4：1326×0.62≈822.1（3-bet 238.7 + 跟注 583.4 = 822.1）
 * [正确] t5hu-preflop-equilibrium idx5：80% × 37.5% = 30%（频率复合 = 开池率 × 防守率）
 * [示意值] t5hu-preflop-equilibrium idx10（块）：4-bet 约 8%、SB 对 3-bet 跟注约 29.5% 为求解器量级的经验拆分，
 *        正文已标「约」，只锁「8% + 29.5% = 37.5%」这一构成关系，不锁单值
 * [正确] t5hu-postflop-equilibrium idx3：SPR 4 → (9^(1/3)−1)/2 ≈ 54%；SPR 7.8 → 78%；SPR 24.5 → 134%
 * [正确] t5hu-postflop-equilibrium idx4：SPR = 98÷4 = 24.5 与 94÷12 ≈ 7.8 两个底池的尺度差
 * [正确] t5hu-postflop-equilibrium idx5：半池三街 12→24→48→96，每人仅推进 6+12+24 = 42bb，余 52bb
 * [正确] t5hu-postflop-equilibrium idx8：MDF 1/(1+b)：1/4→80%、1/3→75%、1/2→67%、1→50%、2→33%
 * [正确] t5hu-postflop-equilibrium idx10（块）：两街版 x = ((1+2·SPR)^(1/2) − 1)/2，
 *        SPR 2/4/7.8/24.5 → 35.5 / 54.0 / 77.5 / 134.2%（三街）与 61.8 / 100 / 153.7 / 303.6%（两街）
 * [正确] t5hu-gto-he idx11（块）：对抗类型与响应方向为定性映射，无新增数值
 * [正确] t5hu-frequency idx11（块）：跟注所需权益 b/(1+2b)：16.7 / 20.0 / 25.0 / 33.3 / 40.0%
 * ==========================================================================
 */

const CHAPTERS: TheoryChapter[] = [
  ...HEADS_UP_LEVEL_5.chapters,
  ...NODE_LOCKING,
  ...PREFLOP_EQ,
  ...POSTFLOP_EQ,
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

/** 复算值取到十分位百分比 */
const pct = (x: number): number => Math.round(x * 1000) / 10;
/** 纯诈唬 EV：f×P − (1−f)×B */
const bluffEv = (fold: number, pot: number, bet: number): number =>
  fold * pot - (1 - fold) * bet;
/** 三街几何尺度 */
const geoThree = (spr: number): number => ((1 + 2 * spr) ** (1 / 3) - 1) / 2;
/** 两街几何尺度 */
const geoTwo = (spr: number): number => ((1 + 2 * spr) ** (1 / 2) - 1) / 2;

const zhLocale = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../../../../../../i18n/locales/zh/theory-content/t5hu.json', import.meta.url),
    ),
    'utf8',
  ),
) as { content: Record<string, string[]>; quiz: Record<string, unknown> };

describe('T5HU 量化审计：节点锁定的偏离定价', () => {
  it('1/3 池 Alpha 25%，f = 60% / 40% / 50% 的三个 EV', () => {
    expect(calculateAlpha(4, 4 / 3)).toBeCloseTo(0.25, 10);
    expect(Math.round(bluffEv(0.6, 4, 1.33) * 100) / 100).toBe(1.87);
    expect(Math.round(bluffEv(0.4, 4, 1.33) * 100) / 100).toBe(0.8);
    expect(Math.round(bluffEv(0.5, 4, 1.33) * 100) / 100).toBe(1.34);
    // 均衡弃牌率处 EV 恰为 0（偏离增益的零点）
    expect(bluffEv(0.25, 4, 4 / 3)).toBeCloseTo(0, 10);
    expectAnswerIs('t5hu-node-locking', 't5hu-node-locking-q2', '25%');
    expectAnswerIs('t5hu-node-locking', 't5hu-node-locking-q3', '+1.87BB');
    expectAnswerIs('t5hu-node-locking', 't5hu-node-locking-q4', '+0.80BB');
  });

  it('块表的观察值 → EV 与公式段同口径（含负值一侧）', () => {
    expect(Math.round(bluffEv(0.15, 4, 1.33) * 100) / 100).toBe(-0.53);
    const block = CONTENT_BLOCKS['t5hu-node-locking']?.[0];
    expect(block?.data?.kind).toBe('table');
    const rows = block?.data?.kind === 'table' ? (block.data.rows as string[][]) : [];
    expect(rows).toEqual([
      ['15%', '−0.53BB'],
      ['25%', '0BB'],
      ['40%', '+0.80BB'],
      ['50%', '+1.34BB'],
      ['60%', '+1.87BB'],
    ]);
  });
});

describe('T5HU 量化审计：翻前均衡的频率复合', () => {
  it('三节点价格：40% / 25% / 62.5%', () => {
    expect(calculateAlpha(1.5, 1)).toBe(0.4);
    expect(requiredEquity(1, 4)).toBe(0.25);
    expect(calculateAlpha(3, 5)).toBeCloseTo(0.625, 10);
    expect(1 - calculateAlpha(3, 5)).toBeCloseTo(0.375, 10);
    // 拆分口径：8% 4-bet + 29.5% 跟注 = 37.5% 继续率
    expect(8 + 29.5).toBe(37.5);
    expectAnswerIs('t5hu-preflop-equilibrium', 't5hu-preflop-equilibrium-q1', '25%');
    expectAnswerIs('t5hu-preflop-equilibrium', 't5hu-preflop-equilibrium-q3', '62.5%');
  });

  it('组合账：1326 × 0.62 ≈ 822，且 239 + 583 = 822', () => {
    expect(Math.round(1326 * 0.62 * 10) / 10).toBe(822.1);
    expect(Math.round(1326 * 0.18)).toBe(239);
    expect(Math.round(1326 * 0.44)).toBe(583);
    expect(239 + 583).toBe(822);
    expectAnswerIs('t5hu-preflop-equilibrium', 't5hu-preflop-equilibrium-q4', '约 822 个');
    // 频率复合：80% × 37.5% = 30%
    expect((0.8 * 0.375 * 100).toFixed(10)).toBe('30.0000000000');
    expect(contentOf('t5hu-preflop-equilibrium')[5]).toContain('30%');
  });
});

describe('T5HU 量化审计：翻后均衡的 SPR 与尺度', () => {
  it('SPR 与三街几何尺度：24.5 → 134%、7.8 → 78%', () => {
    expect(98 / 4).toBe(24.5);
    expect(pct(geoThree(24.5))).toBe(134.2);
    expect(pct(geoThree(4))).toBe(54);
    expect(pct(geoThree(7.8))).toBe(77.5);
    expect(pct(geoThree(94 / 12))).toBe(77.7);
    expectAnswerIs('t5hu-postflop-equilibrium', 't5hu-postflop-equilibrium-q1', '约 24.5');
    expectAnswerIs('t5hu-postflop-equilibrium', 't5hu-postflop-equilibrium-q2', '78% 池');
    expectAnswerIs(
      't5hu-postflop-equilibrium',
      't5hu-postflop-equilibrium-q5',
      '100BB 单加注池三街打光需要超大尺度，实战更常用 1/3-2/3 池的小尺度分层兑现',
    );
  });

  it('半池三街只能推进 42bb：12 → 24 → 48 → 96', () => {
    let pot = 12;
    const perStreet: number[] = [];
    for (let street = 0; street < 3; street += 1) {
      const bet = pot / 2;
      perStreet.push(bet);
      pot += 2 * bet;
    }
    expect(perStreet).toEqual([6, 12, 24]);
    expect(pot).toBe(96);
    expect(6 + 12 + 24).toBe(42);
    expect(94 - 42).toBe(52);
    expect(contentOf('t5hu-postflop-equilibrium')[5]).toContain('42BB');
    expect(contentOf('t5hu-postflop-equilibrium')[5]).toContain('52BB');
  });

  it('两街几何尺度与三街并列（块表四行逐位复算）', () => {
    expect(pct(geoTwo(2))).toBe(61.8);
    expect(pct(geoTwo(4))).toBe(100);
    expect(pct(geoTwo(7.8))).toBe(153.7);
    expect(pct(geoTwo(24.5))).toBe(303.6);
    expect(pct(geoThree(2))).toBe(35.5);
    expectAnswerIs('t5hu-postflop-equilibrium', 't5hu-postflop-equilibrium-q3', '80%');
    expectAnswerIs('t5hu-postflop-equilibrium', 't5hu-postflop-equilibrium-q4', '50%');
  });
});

describe('T5HU 量化审计：既有章新增题（q6-q8）的数值', () => {
  it('t5hu-gto-he-q6：min-raise 偷盲保本弃牌率 50%', () => {
    // f×1.5 − (1−f)×1.5 = 0 → f = 50%（沉没成本口径，与 t3hu-sb-strategy 单源）
    expect(1.5 / (1.5 + 1.5)).toBe(0.5);
    expect(bluffEv(0.5, 1.5, 1.5)).toBe(0);
    expectAnswerIs('t5hu-gto-he', 't5hu-gto-he-q6', '50%');
  });

  it('t5hu-frequency：1/3 池 MDF 75%、2 倍池 Alpha 66.7%、诈唬 EV +1.34BB', () => {
    expect(calculateMDF(4, 4 / 3)).toBeCloseTo(0.75, 10);
    expect(pct(calculateAlpha(4, 8))).toBe(66.7);
    expect(pct(calculateMDF(4, 8))).toBe(33.3);
    expect(Math.round(bluffEv(0.5, 4, 1.33) * 100) / 100).toBe(1.34);
    expectAnswerIs('t5hu-frequency', 't5hu-frequency-q6', '75%');
    expectAnswerIs('t5hu-frequency', 't5hu-frequency-q7', '66.7%');
    expectAnswerIs('t5hu-frequency', 't5hu-frequency-q8', '+1.34BB');
  });
});

describe('T5HU 内容轨：数据 ↔ zh locale 追加对齐', () => {
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

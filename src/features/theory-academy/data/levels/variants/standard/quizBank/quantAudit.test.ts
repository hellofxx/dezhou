import { describe, expect, it } from 'vitest';
import { standardLevels } from '../index';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../../../types';

/**
 * 扩容题库的量化断言审计（新题 q6+）。
 *
 * 既有题的复算索引在 standardQuantAudit / supplementalQuantAudit 中；本文件只锁定
 * 本次扩容新增的数值题：题面数字、correctIndex 与正确选项文本三者任一漂移即变红。
 * 口径与既有审计同源：MDF=1/(1+b)、α=b/(1+b)、跟注权益=b/(1+2b)、几何尺度
 * x=((1+2·SPR)^(1/3)−1)/2、ICM 递归、组合计数 C(n,k)。
 */
const chapters = standardLevels.flatMap((level) => level.chapters);

const getQuiz = (chapterId: string, questionId: string): TheoryQuizQuestion => {
  const chapter = chapters.find((candidate) => candidate.id === chapterId) as TheoryChapter | undefined;
  expect(chapter, `章节 ${chapterId} 存在`).toBeDefined();
  const question = chapter!.quiz.find((q) => q.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question!;
};

const expectAnswerIs = (chapterId: string, questionId: string, answer: string): void => {
  const question = getQuiz(chapterId, questionId);
  expect(question.options[question.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
};

describe('quizBank 量化审计：组合与概率', () => {
  it('T1 组合数、条件概率、补牌与方差', () => {
    expect(3 * 6).toBe(18);
    expectAnswerIs('t1-combinatorics', 't1-combinatorics-q6', '18 种');

    const pAA = 3 / 1225;
    expect(pAA * 100).toBeGreaterThan(0.24);
    expect(pAA * 100).toBeLessThan(0.25);
    expectAnswerIs('t1-combinatorics', 't1-combinatorics-q8', '0.24%');

    expect(9 + 8 - 2).toBe(15);
    expectAnswerIs('t1-outs', 't1-outs-q6', '15 个');
    expect((9 / 46) * 100).toBeGreaterThan(19.5);
    expect((9 / 46) * 100).toBeLessThan(19.7);
    expectAnswerIs('t1-outs', 't1-outs-q8', '19.6%');

    // 400 手 = 4 个百手样本 → 100×√4
    expect(100 * Math.sqrt(4)).toBe(200);
    expectAnswerIs('t1-variance', 't1-variance-q7', '200bb');
    // n ∝ σ²：σ 翻倍 → 4 倍
    expect((2 * 80) ** 2 / 80 ** 2).toBe(4);
    expectAnswerIs('t1-variance', 't1-variance-q8', '4 倍');

    expect(1.5 / 6).toBe(0.25);
    expectAnswerIs('t1-sixmax-table', 't1-sixmax-table-q6', '0.25bb');
  });

  it('T2 EV 与赔率', () => {
    expect(0.5 / 1.5).toBeCloseTo(1 / 3, 10);
    expectAnswerIs('t2-ev', 't2-ev-q6', '33.3%');
    expect(0.6 * 100 + 0.4 * 150).toBe(120);
    expectAnswerIs('t2-ev', 't2-ev-q7', '120');

    expect((2 / 3) / (1 + 4 / 3)).toBeCloseTo(2 / 7, 10);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q6', '28.6%');
    expect(40 / 160).toBe(0.25);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q7', '25%');
    expect(1.5 / 4).toBe(0.375);
    expectAnswerIs('t2-pot-odds', 't2-pot-odds-q8', '37.5%');

    const setP = 144 / 1225;
    expect((1 - setP) / setP).toBeCloseTo(7.5, 1);
    expectAnswerIs('t2-implied-odds', 't2-implied-odds-q6', '7.5:1');
    expect((0.8 * 50) / 0.2 - 150).toBe(50);
    expectAnswerIs('t2-implied-odds', 't2-implied-odds-q8', '50');
  });

  it('T3 位置实现率与盲注防守门槛', () => {
    expect(0.5 * 0.85).toBe(0.425);
    expectAnswerIs('t3-position-value', 't3-position-value-q7', '42.5%');
    expect(1.5 / 5.5).toBeCloseTo(0.2727, 4);
    expectAnswerIs('t3-blind-battle', 't3-blind-battle-q4', '27.3%');
  });

  it('T4 阻断组合、4-bet MDF 与结构经济学', () => {
    expect(3 * 4).toBe(12);
    expectAnswerIs('t4-combinatorics', 't4-combinatorics-q6', '12 种');
    expectAnswerIs('t4-combinatorics', 't4-combinatorics-q7', '3 种');

    expect(12 / 29.5).toBeCloseTo(0.4068, 4);
    expectAnswerIs('t4-preflop-structure', 't4-preflop-structure-q6', '40.7%');

    expect(2.25 / (2.5 + 2.25)).toBeCloseTo(0.4737, 4);
    expect(2.25 / (1.5 + 2.25)).toBeCloseTo(0.6, 10);
    expectAnswerIs('t4-structure-economics', 't4-structure-economics-q6', '约 60.0% → 47.4%');
  });
});

describe('quizBank 量化审计：博弈论与人数效应', () => {
  it('T5 价值诈唬比、MDF/Alpha 与多人责任分摊', () => {
    // 满池 b=1 → 诈唬 1/3，价值:诈唬 = 2:1
    expect((1 - 1 / 3) / (1 / 3)).toBeCloseTo(2, 10);
    expectAnswerIs('t5-gto-concept', 't5-gto-concept-q6', '2:1');

    expect(1 / (1 + 1 / 3)).toBe(0.75);
    expectAnswerIs('t5-mdf-alpha', 't5-mdf-alpha-q6', '75%');
    expect((1 / 3) / (1 + 1 / 3)).toBe(0.25);
    expectAnswerIs('t5-mdf-alpha', 't5-mdf-alpha-q7', '25%');

    expect((1 / 3) ** 2).toBeCloseTo(0.1111, 4);
    expectAnswerIs('t5-multiway-frequency', 't5-multiway-frequency-q6', '11.1%');
    expect(1 - Math.sqrt(1 / 3)).toBeCloseTo(0.4226, 4);
    expectAnswerIs('t5-multiway-frequency', 't5-multiway-frequency-q7', '42.3%');
  });

  it('T6 几何尺度、加注底池账本与河牌两把尺子', () => {
    const geo = (Math.cbrt(1 + 2 * 4) - 1) / 2;
    expect(geo).toBeCloseTo(0.54, 2);
    expectAnswerIs('t6-geometric', 't6-geometric-q7', '54% 池');

    expect(90 / 20.5).toBeCloseTo(4.39, 2);
    expectAnswerIs('t6-3bet-pot', 't6-3bet-pot-q4', '4.4');
    expect(80 / 200.5).toBeCloseTo(0.399, 3);
    expectAnswerIs('t6-3bet-pot', 't6-3bet-pot-q5', '39.9%');
    expect(20.5 / 3).toBeCloseTo(6.83, 2);
    expectAnswerIs('t6-3bet-pot', 't6-3bet-pot-q7', '约 7bb');

    expect(0.75 / 1.75).toBeCloseTo(0.4286, 4);
    expectAnswerIs('t6-turn-river', 't6-turn-river-q4', '42.9%');
    expect(0.75 / 2.5).toBe(0.3);
    expectAnswerIs('t6-turn-river', 't6-turn-river-q5', '30%');
    expect(4 / (16 + 4)).toBe(0.2);
    expect((1 / 3) / (1 + 2 / 3)).toBeCloseTo(0.2, 10);
    expectAnswerIs('t6-turn-river', 't6-turn-river-q7', '1/3 池');

    expect(97.5 / 5.5).toBeCloseTo(17.727, 2);
    expectAnswerIs('t6-srp-postflop', 't6-srp-postflop-q4', '17.7');
    expect((1 / 3) / (1 + 1 / 3)).toBe(0.25);
    expectAnswerIs('t6-srp-postflop', 't6-srp-postflop-q5', '25%');
  });
});

describe('quizBank 量化审计：心理与锦标赛', () => {
  it('T8 Tilt 损失与凯利下注比例', () => {
    expect((8 - -15) * 30).toBe(690);
    expectAnswerIs('t8-tilt', 't8-tilt-q6', '690bb');
    expect((1 * 0.55 - 0.45) / 1).toBeCloseTo(0.1, 10);
    expectAnswerIs('t8-bankroll-psych', 't8-bankroll-psych-q7', '10%');
  });

  it('T9 多人胜率、Alpha 与现金/锦标赛两套账', () => {
    expectAnswerIs('t9-multiway', 't9-multiway-q6', '64%');
    expect(1.5 / 2.5).toBe(0.6);
    expectAnswerIs('t9-alpha', 't9-alpha-q6', '60%');

    expect(0.55 * 3000 - 0.45 * 3000).toBeCloseTo(300, 6);
    expectAnswerIs('t9-cash-vs-mtt', 't9-cash-vs-mtt-q6', '+300 筹码');
    expect(10000 / 1000).toBe(10);
    expectAnswerIs('t9-cash-vs-mtt', 't9-cash-vs-mtt-q7', '10');
  });
});

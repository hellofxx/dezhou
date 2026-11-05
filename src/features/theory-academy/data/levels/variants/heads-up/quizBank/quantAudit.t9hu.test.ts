/**
 * 阶段 7 量化断言审计 · heads-up T9 内容轨（C4）· 侧内守卫测试。
 *
 * 与 `variants/variantQuantAudit.test.ts` 同一口径（批次 2 单源），两部分职责：
 * 1. **题库可复算断言**：新增题里带明确数字的判分题，在本文件内**重新计算**
 *    （零和校验、α / MDF 配对、跟注所需权益、钱 EV 线性、标准误、SPR、打平胜率），
 *    断言正确选项文本与复算结果一致——数字、correctIndex、选项文本任一漂移即红。
 * 2. **文件头人工复核索引**：正文散文里无法自动断言的数值按「[正确] / [示意值] /
 *    [查表值] / [定性] / [假设]」分类登记（锚点 = 章节 id + content 索引，**0 起、含 heading 段**）。
 *
 * 口径来源：`utils/theoryFormulas` 的 calculateAlpha / calculateMDF / requiredEquity
 * 直接调用，不在本文件重写分数；标准误走 √(p(1−p)/n)。
 *
 * ===== 人工复核索引（T9 内容轨）=====
 * [正确] t9hu-mastery idx3 + q6：SPR = (100−2)÷4 = 24.5、20bb 4.5、10bb 2.0
 * [正确] t9hu-pro-study idx3 + q6：纯偷盲 EV = f×1.5 − (1−f)×1.5；f=0.6 → +0.3、f=0.75 → +0.75
 * [正确] t9hu-mop idx3 + q2：0.6×100 − 50 = +10 与 0.4×100 − 50 = −10，两侧和为 0
 * [正确] t9hu-mop idx4 + q3/q5：α = b÷(P+b)、MDF = 1−α；半池 33.3%/66.7%、满池 50%/50%、
 *        两倍池 66.7%/33.3%；诈唬密度 = α÷(1+α)，满池 1/3（价值:诈唬 2:1）
 * [正确] t9hu-mop idx5 + q4：跟注所需权益 = 5÷(10+10) = 25%
 * [正确] t9hu-icm idx3 + q2：钱 EV = 60 + 份额×40；60/40 → 84、25/75 → 70，和为 160
 * [正确] t9hu-icm idx4 + q3：100p + 68(1−p) = 84 → p = 50%；筹码 EV 20 + 80p = 60 同解 50%
 *        ⇒ 双人奖金表对筹码线性，单挑内部无风险溢价（本章核心结论）
 * [正确] t9hu-icm idx5 + q4/q5/q6：20bb 有前注 19÷41 ≈ 46.3%、无前注 19÷40 = 47.5%；
 *        10bb 有前注 9÷21 ≈ 42.9%、无前注 9÷20 = 45.0%（前注 0.5+0.5、盲注 1/1）
 * [示意值] t9hu-icm idx2：奖金表 100/60 为教学设定；结论「线性 ⇒ 无风险溢价」对任意两档奖金成立，
 *        具体百分数随奖金表变动
 * [正确] t9hu-unified idx3 + q2：MDF = 10÷15 = 66.7%、α = 33.3%
 * [正确] t9hu-unified idx4 + q3/q4/q7：SE = √(0.45×0.55÷n)；n=100 → 5.0%、n=20 → 11.1%；
 *        缺口 11.7 点 ÷ 5.0% ≈ 2.3 个标准误
 * [正确] t9hu-unified idx5 + q5/q6：EV = f×P − (1−f)×b；f=0.55 → +3.25bb；f=α → 约 0
 * [假设] t9hu-unified idx4/idx5 的「100 手样本 45 次弃牌」为教学设定的观察值，
 *        机制（样本下界决定偏离幅度）不变
 * [正确] t9hu-cash-vs-mtt idx3 + q1/q2/q3：SPR = (stack−2)÷4 → 24.5 / 4.5 / 2.0
 * [正确] t9hu-cash-vs-mtt idx4 + q4：19÷41 ≈ 46.3%（与 t9hu-icm 同一死钱口径）
 * [正确] t9hu-cash-vs-mtt idx5 + q5：打平胜率 = (100+10)÷200 = 55%
 * [示意值] t9hu-cash-vs-mtt idx5：现金抽水「平均 0.5–1bb/手」为业界典型量级，正文写「约」；
 *        每小时 100–200bb 的成本结论继承该量级
 * [定性] t9hu-cash-vs-mtt idx6/idx7：结构性差异（无重买 / 盲注上涨 / 可离桌）为机制陈述
 */
import { describe, it, expect } from 'vitest';
import { QUIZ_BANK } from './t9hu';
import { calculateAlpha, calculateMDF, requiredEquity } from '../../../../../utils/theoryFormulas';
import type { TheoryQuizQuestion } from '../../../../../types';

const answer = (chapterId: string, questionId: string): string => {
  const questions = QUIZ_BANK[chapterId];
  expect(questions, `章节 ${chapterId} 在题库中存在`).toBeDefined();
  const question = (questions as TheoryQuizQuestion[]).find((item) => item.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  const found = question as TheoryQuizQuestion;
  return found.options[found.correctIndex] as string;
};

const percent1 = (value: number): number => Math.round(value * 1000) / 10;
const percent2 = (value: number): number => Math.round(value * 10000) / 100;

describe('T9 题库结构（id 契约 / 四选一 / 题号连续）', () => {
  it('每章 8 题、题号 1..8 连续、四选一、correctIndex 界内', () => {
    for (const [chapterId, questions] of Object.entries(QUIZ_BANK)) {
      expect(questions.length, chapterId).toBe(8);
      questions.forEach((question, index) => {
        expect(question.id).toBe(`${chapterId}-q${index + 1}`);
        expect(question.options.length).toBe(4);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(4);
        expect(question.question.trim()).not.toBe('');
        expect(question.explanation.trim()).not.toBe('');
      });
    }
  });
});

describe('T9 量化审计：零和校验与均衡配对', () => {
  it('t9hu-mop-q2：0.6×100−50 = +10 与 −10，两侧和为 0', () => {
    const hero = 0.6 * 100 - 50;
    const villain = 0.4 * 100 - 50;
    expect(hero).toBeCloseTo(10, 10);
    expect(villain).toBeCloseTo(-10, 10);
    expect(hero + villain).toBeCloseTo(0, 10);
    expect(answer('t9hu-mop', 't9hu-mop-q2')).toBe('+10bb');
  });

  it('t9hu-mop-q3/q5：半池 α 33.3% / MDF 66.7%，满池诈唬密度 1/3', () => {
    expect(percent1(calculateAlpha(10, 5))).toBe(33.3);
    expect(percent1(calculateMDF(10, 5))).toBe(66.7);
    expect(percent1(calculateAlpha(10, 10))).toBe(50);
    expect(percent1(calculateAlpha(10, 20))).toBe(66.7);
    const density = calculateAlpha(10, 10) / (1 + calculateAlpha(10, 10));
    expect(density).toBeCloseTo(1 / 3, 10);
    expect(answer('t9hu-mop', 't9hu-mop-q3')).toBe('33.3% 与 66.7%');
    expect(answer('t9hu-mop', 't9hu-mop-q5')).toBe('1/3');
  });

  it('t9hu-mop-q4：跟注所需权益 5÷20 = 25%', () => {
    expect(requiredEquity(5, 20)).toBe(0.25);
    expect(answer('t9hu-mop', 't9hu-mop-q4')).toBe('25%');
  });
});

describe('T9 量化审计：ICM 线性与全下阈值', () => {
  it('t9hu-icm-q2/q3：钱 EV 线性（84 / 76，和 160）、无差别胜率 50%', () => {
    const hero = 0.6 * 100 + 0.4 * 60;
    const villain = 0.4 * 100 + 0.6 * 60;
    expect(hero).toBeCloseTo(84, 10);
    expect(villain).toBeCloseTo(76, 10);
    expect(hero + villain).toBeCloseTo(160, 10);
    // 100p + 68(1 − p) = 84 → p = 50%；筹码 EV 20 + 80p = 60 同解
    const p = (84 - 68) / (100 - 68);
    expect(p).toBe(0.5);
    expect((60 - 20) / 80).toBe(0.5);
    expect(answer('t9hu-icm', 't9hu-icm-q2')).toBe('84');
    expect(answer('t9hu-icm', 't9hu-icm-q3')).toBe('50%');
  });

  it('t9hu-icm-q4/q5/q6：前注把 20bb 门槛压到 46.3%、10bb 压到 42.9%', () => {
    expect(percent1(requiredEquity(19, 41))).toBe(46.3);
    expect(percent1(requiredEquity(19, 40))).toBe(47.5);
    expect(percent1(requiredEquity(9, 21))).toBe(42.9);
    expect(percent1(requiredEquity(9, 20))).toBe(45);
    expect(answer('t9hu-icm', 't9hu-icm-q4')).toBe('46.3%');
    expect(answer('t9hu-icm', 't9hu-icm-q5')).toBe('47.5%');
    expect(answer('t9hu-icm', 't9hu-icm-q6')).toBe('42.9%');
  });
});

describe('T9 量化审计：统一框架的偏离证据链', () => {
  it('t9hu-unified-q2：半池 MDF 66.7%', () => {
    expect(percent1(calculateMDF(10, 5))).toBe(66.7);
    expect(answer('t9hu-unified', 't9hu-unified-q2')).toBe('66.7%');
  });

  it('t9hu-unified-q3/q4/q7：SE 5.0% / 11.1%，缺口 11.7 点 ≈ 2.3 个标准误', () => {
    const se100 = Math.sqrt((0.45 * 0.55) / 100);
    const se20 = Math.sqrt((0.45 * 0.55) / 20);
    expect(percent1(se100)).toBe(5);
    expect(percent1(se20)).toBe(11.1);
    const gap = 45 - 33.3;
    expect(gap).toBeCloseTo(11.7, 10);
    expect(Math.round((gap / percent1(se100)) * 10) / 10).toBe(2.3);
    expect(answer('t9hu-unified', 't9hu-unified-q3')).toBe('约 5.0%');
    expect(answer('t9hu-unified', 't9hu-unified-q4')).toBe('约 11.1%');
    expect(answer('t9hu-unified', 't9hu-unified-q7')).toBe('约 2.3 个标准误，够格设偏离');
  });

  it('t9hu-unified-q5/q6：弃牌 55% → +3.25bb；弃牌 = α → 约 0', () => {
    expect(0.55 * 10 - 0.45 * 5).toBeCloseTo(3.25, 10);
    expect((1 / 3) * 10 - (2 / 3) * 5).toBeCloseTo(0, 6);
    expect(answer('t9hu-unified', 't9hu-unified-q5')).toBe('+3.25bb');
    expect(answer('t9hu-unified', 't9hu-unified-q6')).toBe('约 0');
  });
});

describe('T9 量化审计：SPR 与打平胜率', () => {
  it('t9hu-mastery-q6 与 t9hu-cash-vs-mtt-q1/q2/q3：SPR = (stack−2)÷4', () => {
    const spr = (stack: number): number => (stack - 2) / 4;
    expect(spr(100)).toBe(24.5);
    expect(spr(20)).toBe(4.5);
    expect(spr(10)).toBe(2);
    expect(answer('t9hu-mastery', 't9hu-mastery-q6')).toBe('24.5');
    expect(answer('t9hu-cash-vs-mtt', 't9hu-cash-vs-mtt-q1')).toBe('24.5');
    expect(answer('t9hu-cash-vs-mtt', 't9hu-cash-vs-mtt-q2')).toBe('4.5');
    expect(answer('t9hu-cash-vs-mtt', 't9hu-cash-vs-mtt-q3')).toBe('2.0');
  });

  it('t9hu-pro-study-q6：纯偷盲 EV = 0.6×1.5 − 0.4×1.5 = +0.3bb', () => {
    expect(0.6 * 1.5 - 0.4 * 1.5).toBeCloseTo(0.3, 10);
    expect(0.75 * 1.5 - 0.25 * 1.5).toBeCloseTo(0.75, 10);
    expect(answer('t9hu-pro-study', 't9hu-pro-study-q6')).toBe('+0.3bb');
  });

  it('t9hu-cash-vs-mtt-q4/q5：全下门槛 46.3%、含 10% 服务费打平胜率 55%', () => {
    expect(percent1(requiredEquity(19, 41))).toBe(46.3);
    expect(percent2(110 / 200)).toBe(55);
    expect(percent2(220 / 400)).toBe(55);
    expect(answer('t9hu-cash-vs-mtt', 't9hu-cash-vs-mtt-q4')).toBe('46.3%');
    expect(answer('t9hu-cash-vs-mtt', 't9hu-cash-vs-mtt-q5')).toBe('55%');
  });
});

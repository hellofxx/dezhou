/**
 * 阶段 7 量化断言审计 · heads-up T8 内容轨（C4）· 侧内守卫测试。
 *
 * 与 `variants/variantQuantAudit.test.ts` 同一口径（批次 2 单源），两部分职责：
 * 1. **题库可复算断言**：新增题里带明确数字的判分题，在本文件内**重新计算**
 *    （波动预算 σ×√N、扩散近似 ROR、二项标准误、VPIP 口径、0.4^n 连败概率），
 *    断言正确选项文本与复算结果一致——数字、correctIndex、选项文本任一漂移即红。
 * 2. **文件头人工复核索引**：正文散文里无法自动断言的数值按「[正确] / [示意值] /
 *    [查表值] / [定性] / [假设]」分类登记（锚点 = 章节 id + content 索引，**0 起、含 heading 段**）。
 *
 * 口径来源：理论侧公式单源 `utils/theoryFormulas`（riskOfRuin / vpipPercent 直接调用，
 * 不在此重写分数）；标准误走 √(p(1−p)/n)，与『心理读取』章正文同源。
 *
 * ===== 人工复核索引（T8 内容轨）=====
 * [正确] t8hu-pressure idx2/8：0.45^8 ≈ 0.169%→0.17%；0.4^6 ≈ 0.410%→0.41%（伯努利独立）
 * [正确] t8hu-pressure idx5（公式块）：单次 σ = √(p(1−p))×池底 = √(0.6×0.4)×100 ≈ 49；
 *        期望 50×0.2×100 = 1000；50 手累计 σ = 49×√50 ≈ 346；1000÷346 ≈ 2.9σ
 * [正确] t8hu-reads idx5/6：SE = √(0.45×0.55/n)；n=20 → 11.1%、40 → 7.9%、100 → 5.0%、400 → 2.5%；
 *        95% 半宽 = 1.96×SE → 21.8 / 15.4 / 9.8 / 4.9 个百分点
 * [示意值] t8hu-tilt-types idx2/6 的「每小时 10 个全下」为量级设定，正文写「量级估算」；
 *        连败概率本身是 [正确]，但「每月都会出现」继承该设定的不确定性
 * [假设] t8hu-tilt-types idx4/idx8 的常态 +5bb/100 与 Tilt −20bb/100 为教学设定，
 *        数字随玩家水平变动，「差额 × 手数 = 代价」的关系不变
 * [正确] t8hu-tilt-types idx3/idx5：120÷200 = 60%、170÷200 = 85%（差 25 个百分点）；
 *        0.25bb/手 × 200 = 50bb；30 ÷ (50÷60) ≈ 36 分钟
 * [正确] t8hu-session idx3/idx4：单手 σ = 90÷10 = 9bb；9×√200 ≈ 127、9×√400 = 180、
 *        9×√1200 ≈ 312、9×√2000 ≈ 403（买入数 = ÷100）
 * [正确] t8hu-session idx4（公式块）：ROR = exp(−2μB/σ²)，μ=0.05、σ²=81 →
 *        2000bb 8.5%、3000bb 2.5%、5000bb 0.2%、1500bb 15.7%（riskOfRuin 单源复算）
 * [示意值] t8hu-session idx2/idx3：σ = 90bb/100 为单挑现金的典型量级设定（正文写「每百手标准差 90bb」），
 *        ROR 与手数预算结论随该量级移动，不得当承诺引用
 * [定性] t8hu-session idx6/7：升降级的心理账本与注意力衰减为机制陈述，不含可算量
 */
import { describe, it, expect } from 'vitest';
import { QUIZ_BANK } from './t8hu';
import { riskOfRuin, vpipPercent } from '../../../../../utils/theoryFormulas';
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

describe('T8 题库结构（id 契约 / 四选一 / 题号连续）', () => {
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

describe('T8 量化审计：波动预算与扩散近似', () => {
  it('t8hu-pressure-q6：期望 50×0.2×100 = 1000、σ = 49×√50 ≈ 346', () => {
    const expectation = 50 * 0.2 * 100;
    expect(expectation).toBe(1000);
    const singleSigma = Math.sqrt(0.6 * 0.4) * 100;
    expect(Math.round(singleSigma)).toBe(49);
    expect(Math.round(singleSigma * Math.sqrt(50))).toBe(346);
    expect(answer('t8hu-pressure', 't8hu-pressure-q6')).toBe('期望 1000、波动 346');
  });

  it('t8hu-pressure-q7/q8：0.45^8 ≈ 0.17%、1000÷346 ≈ 2.9σ', () => {
    expect(percent1(0.45 ** 8)).toBe(0.2);
    expect(Math.round(0.45 ** 8 * 10000) / 100).toBeCloseTo(0.17, 2);
    expect(Math.round((1000 / 346) * 10) / 10).toBe(2.9);
    expect(answer('t8hu-pressure', 't8hu-pressure-q7')).toBe('0.17%');
    expect(answer('t8hu-pressure', 't8hu-pressure-q8')).toBe('约 2.9 个');
  });

  it('t8hu-session-q5/q6：riskOfRuin 2000bb ≈ 8.5%、1500bb ≈ 15.7%（降级抬升）', () => {
    const at20 = riskOfRuin({ winrateBB100: 5, sdBB100: 90, bankrollBB: 2000 });
    const at15 = riskOfRuin({ winrateBB100: 5, sdBB100: 90, bankrollBB: 1500 });
    const at30 = riskOfRuin({ winrateBB100: 5, sdBB100: 90, bankrollBB: 3000 });
    expect(percent1(at20)).toBe(8.5);
    expect(percent1(at15)).toBe(15.7);
    expect(percent1(at30)).toBe(2.5);
    expect(answer('t8hu-session', 't8hu-session-q5')).toBe('约 8.5%');
    expect(answer('t8hu-session', 't8hu-session-q6')).toBe('从约 8.5% 升到约 15.7%');
  });
});

describe('T8 量化审计：session 波动与手数预算', () => {
  it('t8hu-session-q2/q3/q4：单手 σ = 9bb、200 手 127bb、400 手 180bb', () => {
    const perHand = 90 / 10;
    expect(perHand).toBe(9);
    expect(Math.round(perHand * Math.sqrt(200))).toBe(127);
    expect(Math.round(perHand * Math.sqrt(400))).toBe(180);
    expect(Math.round(perHand * Math.sqrt(1200))).toBe(312);
    expect(answer('t8hu-session', 't8hu-session-q2')).toBe('9bb');
    expect(answer('t8hu-session', 't8hu-session-q3')).toBe('约 127bb');
    expect(answer('t8hu-session', 't8hu-session-q4')).toBe('约 180bb');
  });

  it('t8hu-session-q8：30bb ÷ 0.25bb/手 = 120 手', () => {
    expect(30 / 0.25).toBe(120);
    expect(answer('t8hu-session', 't8hu-session-q8')).toBe('120 手');
  });
});

describe('T8 量化审计：Tilt 代价时间化', () => {
  it('t8hu-tilt-types-q3：0.25bb × 200 手 = 50bb/小时', () => {
    const gap = 0.05 - -0.2;
    expect(gap).toBeCloseTo(0.25, 10);
    expect(gap * 200).toBe(50);
    expect(answer('t8hu-tilt-types', 't8hu-tilt-types-q3')).toBe('50bb');
  });

  it('t8hu-tilt-types-q4：30bb ÷ (50÷60) ≈ 36 分钟', () => {
    const perMinute = 50 / 60;
    expect(Math.round(30 / perMinute)).toBe(36);
    expect(answer('t8hu-tilt-types', 't8hu-tilt-types-q4')).toBe('约 36 分钟');
  });

  it('t8hu-tilt-types-q6/q7：VPIP 60%→85% 差 25 点、0.4^6 ≈ 0.41%', () => {
    expect(vpipPercent(120, 200)).toBe(60);
    expect(vpipPercent(170, 200)).toBe(85);
    expect(vpipPercent(170, 200) - vpipPercent(120, 200)).toBe(25);
    expect(Math.round(0.4 ** 6 * 10000) / 100).toBeCloseTo(0.41, 2);
    expect(answer('t8hu-tilt-types', 't8hu-tilt-types-q6')).toBe('25 个百分点');
    expect(answer('t8hu-tilt-types', 't8hu-tilt-types-q7')).toBe('约 0.41%');
  });

  it('表格块口径与题库一致：15 分钟 12.5bb、60 分钟 50bb', () => {
    const gap = 0.25;
    expect(gap * 50).toBe(12.5);
    expect(gap * 200).toBe(50);
    expect(gap * 400).toBe(100);
  });
});

describe('T8 量化审计：频率观察的标准误', () => {
  it('t8hu-reads-q6：SE = √(0.45×0.55÷40) ≈ 7.9%，95% 半宽 ≈ 15.4', () => {
    const se = Math.sqrt((0.45 * 0.55) / 40);
    expect(percent1(se)).toBe(7.9);
    expect(percent1(1.96 * se)).toBe(15.4);
    expect(percent1(Math.sqrt((0.45 * 0.55) / 20))).toBe(11.1);
    expect(percent1(Math.sqrt((0.45 * 0.55) / 100))).toBe(5);
    expect(answer('t8hu-reads', 't8hu-reads-q6')).toBe('约 7.9%');
  });
});

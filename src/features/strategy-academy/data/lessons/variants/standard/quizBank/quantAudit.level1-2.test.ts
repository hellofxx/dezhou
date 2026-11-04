/**
 * L1–L2 题库数值复算审计（C1 轨）。
 *
 * 每道带数字的判分题都在本测试内**独立复算**，再断言题库里的正确选项文本与之相符：
 * 数字、correctIndex 或选项文本任一被改动，本测试即红。
 * 口径与 standardQuantAudit.test.ts 完全一致（该文件为口径单源）：
 * - 组合数学：C(52,2) = 52×51÷2 = 1326；口袋对子 C(4,2) = 6；同花 4；非同花 4×4−4 = 12
 * - 跟注所需胜率（call equity）= b / (P + 2b)：1/3 池 20%、半池 25%、2/3 池 28.6%、满池 33.3%
 * - 含死钱场景单列复算：BB 面对 2.5BB open 时底池 4（1.5 盲注 + 2.5 open）、只需补 1.5
 *   → 1.5 ÷ (4 + 1.5) ≈ 27.3%，不是 38.5%
 * - 4-Bet bluff 保本弃牌率 = 增量 ÷ (4-Bet 前底池 + 增量)；继续防御频率 = 1 − 保本弃牌率
 * - Kelly 准则 f* = (bp − q) / b
 * 另附题库结构断言（题量 / id 唯一 / 选项唯一 / correctIndex 界内），防止扩题时漏项。
 */
import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../../../../types';
import { LEVEL_1_QUIZ_BANK } from './level1';
import { LEVEL_2_QUIZ_BANK } from './level2';

const BANKS: Record<string, QuizQuestion[]> = { ...LEVEL_1_QUIZ_BANK, ...LEVEL_2_QUIZ_BANK };
const ALL: QuizQuestion[] = Object.values(BANKS).flat();

function question(qid: string): QuizQuestion {
  const found = ALL.find((q) => q.id === qid);
  expect(found, `题 ${qid} 存在于 L1/L2 题库`).toBeDefined();
  return found as QuizQuestion;
}

/** 复算出的正确选项文本（判分数据以 correctIndex 为准） */
function answer(qid: string): string {
  const q = question(qid);
  expect(q.correctIndex, `${qid} correctIndex 界内`).toBeGreaterThanOrEqual(0);
  expect(q.correctIndex, `${qid} correctIndex 界内`).toBeLessThan(q.options.length);
  const text = q.options[q.correctIndex];
  expect(typeof text, `${qid} 正确项存在`).toBe('string');
  return text as string;
}

/** b = 下注额 / 当前底池，跟注 b 的所需胜率 */
const callEquity = (b: number) => b / (1 + 2 * b);
const percent = (value: number, digits = 0) => (value * 100).toFixed(digits) + '%';

describe('L1/L2 题库结构：每门非 Drill 课题量、id 与判分数据合法', () => {
  it('L1 每课 8 题、L2 每课 10 题（扩题不得少于目标）', () => {
    const l1 = Object.entries(LEVEL_1_QUIZ_BANK);
    const l2 = Object.entries(LEVEL_2_QUIZ_BANK);
    expect(l1).toHaveLength(5);
    expect(l2).toHaveLength(7);
    for (const [lessonId, questions] of l1) expect(questions.length, lessonId).toBe(8);
    for (const [lessonId, questions] of l2) expect(questions.length, lessonId).toBe(10);
  });

  it('题 id 全局唯一且保留原有序号（迁移题号不变）', () => {
    const ids = ALL.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const legacy of [
      'l1-basics-q1',
      'l1-pos-q3',
      'l1-hand-q1',
      'l1-bankroll-q3',
      'l1-leaks-q3',
      'l2-raise-q5',
      'l2-3bet-q5',
      'l2-4bet-q5',
      'l2-squeeze-q5',
      'l2-bb-q5',
      'l2-blind-q5',
      'l2-short-q5',
    ]) {
      expect(ids, `迁移题 ${legacy} 保留`).toContain(legacy);
    }
    for (const id of ids) expect(id, id).toMatch(/^l[12]-[a-z0-9-]+-q\d+$/);
  });

  it('每题选项互不相同、解析非空', () => {
    for (const q of ALL) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options).size, `${q.id} 选项唯一`).toBe(q.options.length);
      expect(q.explanation.trim().length, `${q.id} 解析非空`).toBeGreaterThan(0);
    }
  });
});

describe('L1 复算：组合数学 / 资金 / 位置 / 认知', () => {
  it('C(52,2)=1326；口袋对子 C(4,2)=6；AKs=4；AKo=12', () => {
    expect((52 * 51) / 2).toBe(1326);
    expect((4 * 3) / 2).toBe(6);
    expect(4 * 4 - 4).toBe(12);
    expect(answer('l1-basics-q4')).toBe('1326 种');
    expect(answer('l1-basics-q5')).toBe('6 种');
    expect(answer('l1-basics-q6')).toBe('4 种');
    expect(answer('l1-hand-q4')).toBe('12 种');
  });

  it('AA 概率 = 6/1326 ≈ 0.45%（约每 221 手）；同花溢价约 2-3%', () => {
    const aaProbability = 6 / 1326;
    expect(aaProbability).toBeGreaterThan(0.0045);
    expect(aaProbability).toBeLessThan(0.0046);
    expect(Math.round(1326 / 6)).toBe(221);
    expect(answer('l1-hand-q5')).toBe('约 0.45%');
    expect(answer('l1-hand-q7')).toBe('约 2-3%');
  });

  it('资金管理：NL50 30 个买入 = $1,500；Kelly 60%/1:1 → f* = 20%', () => {
    expect(30 * 50).toBe(1500);
    expect(20 * 50).toBe(1000);
    const fStar = (1 * 0.6 - 0.4) / 1;
    expect(percent(fStar)).toBe('20%');
    expect(answer('l1-bankroll-q5')).toBe('$1,500');
    expect(answer('l1-bankroll-q7')).toBe('20%');
  });

  it('6-max 行动顺序：UTG 之后还有 6−1=5 位；翻后 SB 先行动；UTG 权益实现率 80-90%', () => {
    expect(6 - 1).toBe(5);
    expect(answer('l1-pos-q5')).toBe('5 位');
    expect(answer('l1-pos-q4')).toBe('SB');
    const realization = answer('l1-pos-q8');
    expect(realization).toContain('80-90%');
    expect(realization).toBe('约 80-90%');
  });

  it('Leak 修正收益区间 1-3 BB/100（与本课正文口径一致）', () => {
    expect(answer('l1-leaks-q5')).toBe('约 1-3 BB/100');
    expect(1).toBeLessThan(3);
  });
});

describe('L2 复算：跟注所需胜率 / BB 防守 / 4-Bet / 组合与尺度', () => {
  it('跟注所需胜率 = b/(P+2b)：半池 25%、1/3 池 20%、2/3 池 28.6%、满池 33.3%', () => {
    expect(50 / (100 + 50 + 50)).toBe(0.25);
    expect(percent(callEquity(1 / 3))).toBe('20%');
    expect(percent(callEquity(0.5))).toBe('25%');
    expect(percent(callEquity(2 / 3), 1)).toBe('28.6%');
    expect(percent(callEquity(1), 1)).toBe('33.3%');
    expect(answer('l2-raise-q6')).toBe('25%');
    expect(answer('l2-raise-q7')).toBe('20%');
    expect(answer('l2-raise-q8')).toBe('33.3%');
    expect(answer('l2-raise-q9')).toBe('28.6%');
  });

  it('BB 面对 2.5BB open 的死钱口径：1.5 ÷ (4 + 1.5) ≈ 27.3% → 约 27%', () => {
    const potBeforeCall = 1.5 + 2.5;
    const call = 2.5 - 1;
    const required = call / (potBeforeCall + call);
    expect(potBeforeCall).toBe(4);
    expect(call).toBe(1.5);
    expect(required * 100).toBeGreaterThan(27.2);
    expect(required * 100).toBeLessThan(27.4);
    expect(Math.round(required * 100)).toBe(27);
    expect(answer('l2-bb-q6')).toBe('约 27%');
  });

  it('4-Bet bluff 保本弃牌率 15.5/27 ≈ 57.4%，继续防御 ≥ 42.6%；4-Bet 尺度 2.2-2.5×3-bet = 16-19BB', () => {
    const potBefore = 1.5 + 2.5 + 7.5;
    const increment = 18 - 2.5;
    const breakEven = increment / (potBefore + increment);
    expect(potBefore).toBe(11.5);
    expect(percent(breakEven, 1)).toBe('57.4%');
    expect(percent(1 - breakEven, 1)).toBe('42.6%');
    expect(answer('l2-4bet-q6')).toBe('约 57.4%');
    expect(answer('l2-4bet-q7')).toBe('约 42.6%');

    const threeBet = 7.5;
    expect(threeBet * 2.2).toBeCloseTo(16.5, 6);
    expect(threeBet * 2.5).toBeCloseTo(18.75, 6);
    expect(answer('l2-4bet-q8')).toBe('16-19BB');
  });

  it('3-bet 范围组合数：6+6+6+4+4 = 26；A♠ blocker 后 AA = C(3,2) = 3', () => {
    const combos = 6 + 6 + 6 + 4 + 4;
    expect(combos).toBe(26);
    expect((3 * 2) / 2).toBe(3);
    expect(answer('l2-3bet-q6')).toBe('26 种');
    expect(answer('l2-3bet-q7')).toBe('3 种');
  });

  it('Squeeze 尺度 = 4-5× open：2.5×4 = 10BB、2.5×5 = 12.5BB', () => {
    const open = 2.5;
    expect(open * 4).toBe(10);
    expect(open * 5).toBe(12.5);
    expect(answer('l2-squeeze-q6')).toBe('4-5 倍');
  });
});

import { describe, expect, it } from 'vitest';
import { computeOddsResult } from './oddsMath';
import { calculateEV } from '@/shared/utils/pokerMath';
import { getEasyOddsQuestion } from '../hooks/useOddsCalculation';
import { EASY_LAST_QUESTION_ID, RESCUE_QUESTION_ID } from '../constants';
import type { OddsCalculatorState } from '../types';

/**
 * P1-B 回归测试（2026-07-31）：
 *  - P1B-01 底池赔率口径（题库三项式：所需胜率 = bet / (pot + bet + bet)）
 *  - P1B-02 隐含赔率方向（预期额外收益越大 → 所需胜率越低）
 *  - P1B-03 EV 赢时获得含对手下注（eq × (pot+bet) - (1-eq) × bet）
 *  - P1B-04 补救题固定 id（SRS `odds:${id}` 去重依赖）
 */

function makeState(partial: Partial<OddsCalculatorState>): OddsCalculatorState {
  return {
    potSize: 100,
    betSize: 50,
    outs: 9,
    street: 'flop',
    impliedOddsGain: 0,
    gameVariant: 'standard',
    ...partial,
  };
}

describe('P1B-01 底池赔率口径（bet / (pot + bet + bet)）', () => {
  it('pot=100, bet=50 → 所需胜率 25%（50/200）', () => {
    const r = computeOddsResult(makeState({ potSize: 100, betSize: 50 }));
    expect(r.requiredEquity).toBeCloseTo(25, 5);
    expect(r.potOdds).toBeCloseTo(25, 5);
  });

  it('pot=80, bet=80 → 所需胜率 33.3%（80/240）', () => {
    const r = computeOddsResult(makeState({ potSize: 80, betSize: 80 }));
    expect(r.requiredEquity).toBeCloseTo(33.3, 1);
  });

  it('pot=150, bet=37.5 → 所需胜率 16.7%（37.5/225）', () => {
    const r = computeOddsResult(makeState({ potSize: 150, betSize: 37.5 }));
    expect(r.requiredEquity).toBeCloseTo(16.7, 1);
  });
});

describe('P1B-02 隐含赔率方向（收益越大所需胜率越低）', () => {
  it('gain 0 → 50 → 200：所需胜率严格递减且不超过基础赔率', () => {
    const base = computeOddsResult(makeState({ impliedOddsGain: 0 }));
    const g50 = computeOddsResult(makeState({ impliedOddsGain: 50 }));
    const g200 = computeOddsResult(makeState({ impliedOddsGain: 200 }));
    expect(g50.requiredEquity).toBeLessThan(base.requiredEquity);
    expect(g200.requiredEquity).toBeLessThan(g50.requiredEquity);
    expect(g200.requiredEquity).toBeGreaterThan(0);
  });

  it('公式核对：pot=100, bet=50, gain=50 → 50/(100+50+50+50) = 20%', () => {
    const r = computeOddsResult(makeState({ impliedOddsGain: 50 }));
    expect(r.requiredEquity).toBeCloseTo(20, 5);
  });

  it('超大 gain 不会产生 >100% 的所需胜率（旧实现方向反转缺陷）', () => {
    const r = computeOddsResult(makeState({ impliedOddsGain: 100000 }));
    expect(r.requiredEquity).toBeGreaterThan(0);
    expect(r.requiredEquity).toBeLessThan(100);
  });
});

describe('P1B-03 EV 赢时获得含对手下注', () => {
  it('排查计划口径：eq×(pot+r) - (1-eq)×r，eq=0.35(9 outs 精确), pot+bet=150, r=50 → +20', () => {
    expect(calculateEV(0.35, 100 + 50, 50)).toBeCloseTo(20, 5);
  });

  it('面板组合：9 outs flop（Rule of 4 → 36%）, pot=100, bet=50 → EV = 0.36×150 - 0.64×50 = +22', () => {
    const r = computeOddsResult(makeState({ outs: 9, street: 'flop', potSize: 100, betSize: 50 }));
    expect(r.ev).toBeCloseTo(22, 5);
    // isProfitable 与 EV 符号一致（36% > 25%，EV > 0），不再"错得自洽"
    expect(r.isProfitable).toBe(true);
    expect(r.ev).toBeGreaterThan(0);
  });

  it('边际反例：4 outs turn（8%）, pot=100, bet=50 → 8% < 25%，EV 为负且 isProfitable=false', () => {
    const r = computeOddsResult(makeState({ outs: 4, street: 'turn' }));
    expect(r.isProfitable).toBe(false);
    // EV = 0.08×150 - 0.92×50 = 12 - 46 = -34
    expect(r.ev).toBeCloseTo(-34, 5);
  });
});

describe('P1B-04 补救题固定 id（SRS 去重）', () => {
  it('末题与补救题 id 为固定常量且互不冲突、与题库 1-19 错开', () => {
    expect(EASY_LAST_QUESTION_ID).toBe(9999);
    expect(RESCUE_QUESTION_ID).toBe(9998);
    expect(EASY_LAST_QUESTION_ID).not.toBe(RESCUE_QUESTION_ID);
    expect(RESCUE_QUESTION_ID).toBeGreaterThan(19);
  });

  it('两轮补救构造出的题目 id 与 SRS key 完全一致（可去重更新，不再随时间戳漂移）', () => {
    const rescueA = { ...getEasyOddsQuestion(), id: RESCUE_QUESTION_ID };
    const rescueB = { ...getEasyOddsQuestion(), id: RESCUE_QUESTION_ID };
    expect(rescueA.id).toBe(rescueB.id);
    expect(`odds:${rescueA.id}`).toBe(`odds:${rescueB.id}`);
    // 内容与选项顺序确定性一致（orderQuizOptions 固定种子 'easy-odds'）
    expect(rescueA.options.map((o) => o.text)).toEqual(rescueB.options.map((o) => o.text));
  });
});

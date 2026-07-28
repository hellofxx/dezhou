import { describe, expect, it } from 'vitest';
import {
  calculateEVFromAction,
  calculateEVLoss,
  compareDecision,
  getOptimalAction,
  isPureStrategy,
  getDominantAction,
} from './strategyCompare';
import { ActionType } from '@/shared/types/action';
import type { HandStrategy } from '../types';

const pureCall: HandStrategy = { fold: 0, call: 1, raise: 0 };
const pureRaise: HandStrategy = { fold: 0, call: 0, raise: 1, raiseAmount: 3 };
const mixed: HandStrategy = { fold: 0.3, call: 0.5, raise: 0.2 };

describe('calculateEVFromAction', () => {
  it('fold EV 始终为 0', () => {
    expect(calculateEVFromAction('fold', 0.5, 10, 2)).toBe(0);
  });

  it('call EV = equity × (pot + call) - (1 - equity) × call', () => {
    // 0.6 × (10 + 2) - 0.4 × 2 = 7.2 - 0.8 = 6.4
    expect(calculateEVFromAction('call', 0.6, 10, 2)).toBeCloseTo(6.4, 10);
  });

  it('raise EV 使用自定义 raiseAmount', () => {
    // 0.6 × (10 + 5) - 0.4 × 5 = 9 - 2 = 7
    expect(calculateEVFromAction('raise', 0.6, 10, 2, 5)).toBeCloseTo(7, 10);
  });

  it('raise EV 默认 raiseAmount = callAmount × 3', () => {
    // 0.5 × (10 + 6) - 0.5 × 6 = 8 - 3 = 5
    expect(calculateEVFromAction('raise', 0.5, 10, 2)).toBeCloseTo(5, 10);
  });
});

describe('calculateEVLoss', () => {
  it('纯 call 策略下用户 call → EV 损失为 0', () => {
    expect(calculateEVLoss('call', undefined, pureCall, 0.5, 10, 2)).toBe(0);
  });

  it('纯 call 策略下用户 fold → 有正 EV 损失', () => {
    expect(calculateEVLoss('fold', undefined, pureCall, 0.5, 10, 2)).toBeGreaterThan(0);
  });

  it('大底池场景：pot=100, call=20', () => {
    const loss = calculateEVLoss('fold', undefined, pureCall, 0.6, 100, 20);
    expect(loss).toBeGreaterThan(0);
    expect(loss).toBeLessThan(100);
  });
});

describe('compareDecision', () => {
  it('用户选择与纯策略一致 → isOptimal=true', () => {
    const result = compareDecision({ action: ActionType.Call }, pureCall, 10, 0.5, 2);
    expect(result.isOptimal).toBe(true);
    expect(result.evLoss).toBe(0);
  });

  it('用户选择与纯策略相反 → isOptimal=false', () => {
    const result = compareDecision({ action: ActionType.Fold }, pureCall, 10, 0.5, 2);
    expect(result.isOptimal).toBe(false);
    expect(result.evLoss).toBeGreaterThan(0.5);
  });
});

describe('getOptimalAction / isPureStrategy / getDominantAction', () => {
  it('getOptimalAction 返回最高频率动作', () => {
    expect(getOptimalAction(pureCall).action).toBe(ActionType.Call);
    expect(getOptimalAction(pureRaise).action).toBe(ActionType.Raise);
  });

  it('isPureStrategy: ≥0.95 判定为纯策略', () => {
    expect(isPureStrategy(pureCall)).toBe(true);
    expect(isPureStrategy(mixed)).toBe(false);
  });

  it('getDominantAction: 纯策略返回动作，混合返回 null', () => {
    expect(getDominantAction(pureRaise)).toBe(ActionType.Raise);
    expect(getDominantAction(mixed)).toBeNull();
  });
});

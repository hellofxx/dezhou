import { describe, expect, it } from 'vitest';
import {
  ACADEMY_MASTERY_THRESHOLDS,
  getMasteryState,
  summarizeMastery,
} from './academyMastery';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('getMasteryState', () => {
  it('阈值边界：80/79/60/59/无分', () => {
    expect(getMasteryState(100)).toBe('mastered');
    expect(getMasteryState(80)).toBe('mastered');
    expect(getMasteryState(79)).toBe('passing');
    expect(getMasteryState(60)).toBe('passing');
    expect(getMasteryState(59)).toBe('needsReview');
    expect(getMasteryState(0)).toBe('needsReview');
    expect(getMasteryState(undefined)).toBe('untested');
  });

  it('支持自定义阈值', () => {
    expect(getMasteryState(70, { mastered: 90, passing: 70 })).toBe('passing');
    expect(getMasteryState(69, { mastered: 90, passing: 70 })).toBe('needsReview');
  });
});

describe('summarizeMastery', () => {
  it('汇总四项计数、总数与最弱项', () => {
    const summary = summarizeMastery(items, { a: 95, b: 80, c: 60, d: 59 });
    expect(summary).toMatchObject({
      mastered: 2,
      passing: 1,
      needsReview: 1,
      untested: 0,
      total: 4,
      weakestId: 'd',
    });
  });

  it('无分项计为未测，不影响最弱项', () => {
    const summary = summarizeMastery(items, { a: 90 });
    expect(summary).toMatchObject({
      mastered: 1,
      passing: 0,
      needsReview: 0,
      untested: 3,
      weakestId: 'a',
    });
  });

  it('同分取传入顺序靠前者', () => {
    const summary = summarizeMastery(items, { a: 70, b: 70 });
    expect(summary.weakestId).toBe('a');
  });

  it('集合外分数不进入统计', () => {
    const summary = summarizeMastery(items, { a: 90, outside: 0 });
    expect(summary.total).toBe(4);
    expect(summary.needsReview).toBe(0);
  });

  it('默认阈值与常量一致', () => {
    expect(ACADEMY_MASTERY_THRESHOLDS).toEqual({ mastered: 80, passing: 60 });
  });
});

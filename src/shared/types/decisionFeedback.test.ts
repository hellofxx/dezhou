import { describe, expect, it } from 'vitest';
import {
  GRADE_THRESHOLDS,
  calculateGrade,
  migrateGrade,
  buildDecisionFeedback,
} from './decisionFeedback';

describe('GRADE_THRESHOLDS', () => {
  it('阈值数值与规格一致（唯一事实源）', () => {
    expect(GRADE_THRESHOLDS).toEqual({
      best: 0,
      correct: 0.5,
      inaccuracy: 2,
      wrong: 5,
      blunder: Infinity,
    });
  });
});

describe('calculateGrade（边界归入更严重等级）', () => {
  it('evLoss ≤ 0 → best', () => {
    expect(calculateGrade(0)).toBe('best');
    expect(calculateGrade(-1)).toBe('best');
  });

  it('0 < evLoss < 0.5 → correct', () => {
    expect(calculateGrade(0.3)).toBe('correct');
  });

  it('边界 0.5 与 2 归入 inaccuracy', () => {
    expect(calculateGrade(0.5)).toBe('inaccuracy');
    expect(calculateGrade(2)).toBe('inaccuracy');
  });

  it('2 < evLoss ≤ 5 → wrong（含边界 5）', () => {
    expect(calculateGrade(2.1)).toBe('wrong');
    expect(calculateGrade(5)).toBe('wrong');
  });

  it('evLoss > 5 → blunder', () => {
    expect(calculateGrade(5.01)).toBe('blunder');
  });
});

describe('migrateGrade（旧三级 → 五级）', () => {
  it('optimal→best / acceptable→correct / error→wrong', () => {
    expect(migrateGrade('optimal')).toBe('best');
    expect(migrateGrade('acceptable')).toBe('correct');
    expect(migrateGrade('error')).toBe('wrong');
  });
});

describe('buildDecisionFeedback', () => {
  it('答对且未提供 evLoss → 默认 0 → best', () => {
    const fb = buildDecisionFeedback({ isCorrect: true, correctAction: 'raise' });
    expect(fb.evLoss).toBe(0);
    expect(fb.grade).toBe('best');
  });

  it('答错且未提供 evLoss → 默认 3 BB → wrong', () => {
    const fb = buildDecisionFeedback({ isCorrect: false, correctAction: 'fold' });
    expect(fb.evLoss).toBe(3);
    expect(fb.grade).toBe('wrong');
  });

  it('提供 evLoss 时不被 isCorrect 掩盖，统一走 calculateGrade', () => {
    const fb = buildDecisionFeedback({ isCorrect: true, evLoss: 0.3, correctAction: 'call' });
    expect(fb.grade).toBe('correct');
  });
});

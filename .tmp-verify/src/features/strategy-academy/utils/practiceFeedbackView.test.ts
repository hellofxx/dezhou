import { describe, expect, it } from 'vitest';
import type { PracticeOption } from '../types';
import {
  readCalibratedEvLoss,
  resolvePracticeFeedbackView,
} from './practiceFeedbackView';

/**
 * 五级反馈三态诚实渲染单元测试。
 * 核心断言：无数据侧 evLoss 时绝不产出等级与 EV 数值（旧实现会用 isCorrect 兜底伪造 wrong/best）。
 */

function makeOption(overrides: Partial<PracticeOption> = {}): PracticeOption {
  return {
    action: 'Fold',
    isCorrect: false,
    explanation: '解析文本',
    ...overrides,
  };
}

describe('readCalibratedEvLoss', () => {
  it('有限数值原样返回（含 0 与负值）', () => {
    expect(readCalibratedEvLoss(makeOption({ evLoss: 0 }))).toBe(0);
    expect(readCalibratedEvLoss(makeOption({ evLoss: 1.2 }))).toBe(1.2);
    expect(readCalibratedEvLoss(makeOption({ evLoss: -0.5 }))).toBe(-0.5);
  });

  it('缺失 / NaN / Infinity 视为未标定', () => {
    expect(readCalibratedEvLoss(makeOption())).toBeNull();
    expect(readCalibratedEvLoss(makeOption({ evLoss: Number.NaN }))).toBeNull();
    expect(readCalibratedEvLoss(makeOption({ evLoss: Number.POSITIVE_INFINITY }))).toBeNull();
    expect(readCalibratedEvLoss(undefined)).toBeNull();
    expect(readCalibratedEvLoss(null)).toBeNull();
  });
});

describe('resolvePracticeFeedbackView', () => {
  it('有标定 evLoss → calibrated，等级与 EV 数值齐备', () => {
    const view = resolvePracticeFeedbackView(makeOption({ isCorrect: false, evLoss: 3 }))!;
    expect(view.mode).toBe('calibrated');
    expect(view.grade).toBe('wrong');
    expect(view.evLoss).toBe(3);
    expect(view.gradeIcon).toBeTruthy();
    expect(view.gradeTitleKey).toBe('feedback.grade.wrong');
    expect(view.containerClass).toContain('grade-wrong');
  });

  it('答对但 evLoss 表明非最优 → 仍按真实 EV 分级（不被 isCorrect 掩盖）', () => {
    const view = resolvePracticeFeedbackView(makeOption({ isCorrect: true, evLoss: 0.8 }))!;
    expect(view.grade).toBe('inaccuracy');
  });

  it('无 evLoss 的答对 → correct 态：无等级、无 EV 数值、容器走 success token', () => {
    const view = resolvePracticeFeedbackView(makeOption({ isCorrect: true }))!;
    expect(view.mode).toBe('correct');
    expect(view.grade).toBeNull();
    expect(view.gradeIcon).toBeNull();
    expect(view.gradeTitleKey).toBeNull();
    expect(view.evLoss).toBeNull();
    expect(view.containerClass).toBe(
      'border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]',
    );
  });

  it('无 evLoss 的答错 → incorrect 态（旧实现在此伪造 wrong 档）', () => {
    const view = resolvePracticeFeedbackView(
      makeOption({ isCorrect: false, evImpact: '-2.0 BB/100' }),
    )!;
    expect(view.mode).toBe('incorrect');
    expect(view.grade).toBeNull();
    expect(view.evLoss).toBeNull();
    expect(view.containerClass).toBe(
      'border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]',
    );
  });

  it('未选中（null）→ null，由调用方走专用渲染分支', () => {
    expect(resolvePracticeFeedbackView(null)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { gradePracticeSelection, pickTimeoutFallbackOption } from './practiceGrading';
import type { PracticeQuestion, PracticeOption } from '../types';

const foldOption: PracticeOption = { action: 'Fold', isCorrect: true, explanation: '' };
const callOption: PracticeOption = { action: 'Call', isCorrect: false, explanation: '' };
const raiseOption: PracticeOption = { action: 'Raise', isCorrect: false, explanation: '' };

const question: PracticeQuestion = {
  id: 'test-q',
  scenario: {
    heroHand: ['As', 'Ks'],
    heroPosition: 'BTN',
    previousActions: [],
    street: 'preflop',
    potSize: 5,
    effectiveStack: 100,
  },
  options: [callOption, raiseOption, foldOption],
};

describe('P1E-13: gradePracticeSelection — 超时恒判错', () => {
  it('非超时 + 正确选项 → true', () => {
    expect(gradePracticeSelection(foldOption, false)).toBe(true);
  });

  it('非超时 + 错误选项 → false', () => {
    expect(gradePracticeSelection(callOption, false)).toBe(false);
  });

  it('超时 + 正确选项（Fold 恰好正确）→ false', () => {
    expect(gradePracticeSelection(foldOption, true)).toBe(false);
  });

  it('超时 + 错误选项 → false', () => {
    expect(gradePracticeSelection(callOption, true)).toBe(false);
  });
});

describe('P1E-13: pickTimeoutFallbackOption', () => {
  it('优先选 Fold 选项', () => {
    const result = pickTimeoutFallbackOption(question);
    expect(result?.action).toBe('Fold');
  });

  it('无 Fold 时选第一个选项', () => {
    const noFold: PracticeQuestion = {
      ...question,
      options: [callOption, raiseOption],
    };
    const result = pickTimeoutFallbackOption(noFold);
    expect(result?.action).toBe('Call');
  });

  it('空选项列表返回 null', () => {
    const empty: PracticeQuestion = { ...question, options: [] };
    expect(pickTimeoutFallbackOption(empty)).toBeNull();
  });
});

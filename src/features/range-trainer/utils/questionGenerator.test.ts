import { describe, it, expect } from 'vitest';
import { Position } from '@/shared/types/position';
import { ADVANCED_PRESET_RANGES, PRESET_RANGES } from '../constants';
import { generateQuestions } from './questionGenerator';

// P1-01 修复回归：call-vs-raise 类（BB 防御）题型，范围内手牌的正确答案应为 'call' 而非 'raise'。
// 修复前 correctAction 无条件硬编码为 'raise'，导致「BB 面对 BTN open 的跟注范围」训练给出错误教学答案。
describe('generateQuestions（P1-01 call-vs-raise 正确答案）', () => {
  const allPresets = [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES];
  const bbCallPreset = allPresets.find((p) => p.id === 'bb-call-vs-btn');

  it('bb-call-vs-btn preset 存在（测试前提）', () => {
    expect(bbCallPreset).toBeDefined();
    expect(bbCallPreset?.actionType).toBe('call-vs-raise');
  });

  it('范围内手牌的 correctAction === call（call-vs-raise 语义）', () => {
    if (!bbCallPreset) throw new Error('preset missing');
    const questions = generateQuestions(
      [bbCallPreset],
      Position.BB,
      'call-vs-raise',
      20,
      {},
    );
    expect(questions.length).toBeGreaterThan(0);
    const inRangeSet = new Set(bbCallPreset.hands);
    const inRangeQuestions = questions.filter((q) => inRangeSet.has(q.hand));
    expect(inRangeQuestions.length).toBeGreaterThan(0);
    for (const q of inRangeQuestions) {
      expect(q.correctAction).toBe('call');
    }
  });

  it('范围外手牌的 correctAction === fold（语义不变）', () => {
    if (!bbCallPreset) throw new Error('preset missing');
    const questions = generateQuestions(
      [bbCallPreset],
      Position.BB,
      'call-vs-raise',
      20,
      {},
    );
    const inRangeSet = new Set(bbCallPreset.hands);
    const outRangeQuestions = questions.filter((q) => !inRangeSet.has(q.hand));
    expect(outRangeQuestions.length).toBeGreaterThan(0);
    for (const q of outRangeQuestions) {
      expect(q.correctAction).toBe('fold');
    }
  });

  it('open 类 preset 范围内手牌仍为 raise（语义不变）', () => {
    const openPreset = allPresets.find((p) => p.actionType === 'open' && p.position === Position.UTG);
    if (!openPreset) throw new Error('preset missing');
    const questions = generateQuestions(
      [openPreset],
      Position.UTG,
      'open',
      20,
      {},
    );
    const inRangeSet = new Set(openPreset.hands);
    const inRangeQuestions = questions.filter((q) => inRangeSet.has(q.hand));
    expect(inRangeQuestions.length).toBeGreaterThan(0);
    for (const q of inRangeQuestions) {
      expect(q.correctAction).toBe('raise');
    }
  });
});

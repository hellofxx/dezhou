import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { usePotOddsStore } from '../store';
import { DEFAULT_ODDS_STATE } from '../constants';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import {
  buildOddsFeedback,
  getEasyOddsQuestion,
  useOddsCalculation,
  useOddsEloRecorder,
  useOddsEmotionRecorder,
  useOddsSrsRecorder,
} from './useOddsCalculation';
import { useProgressStore } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

/**
 * pot-odds hooks 契约（L2 / jsdom）：
 * 计算口径（useOddsCalculation）与答题后三处跨模块同步（ELO math / SRS / Emotion）
 * 是模块的两个不可退让契约；这里断言 store 的可观察副作用，而不是 hook 内部实现。
 */
function resetOddsStore() {
  usePotOddsStore.setState({ oddsState: { ...DEFAULT_ODDS_STATE } });
}

function resetProgress(mathElo = DEFAULT_ELO.math) {
  useProgressStore.setState({
    activeVariant: 'standard',
    reviewItems: [],
    emotion: { ...DEFAULT_EMOTION_STATE },
    eloByVariant: {
      standard: { ...DEFAULT_ELO, math: mathElo, variant: 'standard' },
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck', gamesPlayed: 0, lastUpdated: 0 },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up', gamesPlayed: 0, lastUpdated: 0 },
    },
  });
}

const standardElo = () => useProgressStore.getState().eloByVariant.standard;

afterEach(() => {
  cleanup();
  resetOddsStore();
  resetProgress();
});

describe('useOddsCalculation 计算口径', () => {
  beforeEach(resetOddsStore);

  it('默认参数（pot=100, bet=50, outs=9, flop）：所需胜率 25%、估算 36%、EV +22', () => {
    const { result } = renderHook(() => useOddsCalculation());
    expect(result.current.potOdds).toBeCloseTo(25, 6);
    expect(result.current.requiredEquity).toBeCloseTo(25, 6);
    expect(result.current.estimatedEquity).toBeCloseTo(36, 6);
    expect(result.current.isProfitable).toBe(true);
    expect(result.current.ev).toBeCloseTo(22, 6);
  });

  it('隐含赔率并入底池：所需胜率下降为 bet/(pot+bet+bet+gain)，EV 口径不变', () => {
    act(() => usePotOddsStore.getState().setImpliedOddsGain(100));
    const { result } = renderHook(() => useOddsCalculation());
    expect(result.current.requiredEquity).toBeCloseTo((50 / 300) * 100, 6);
    // P1B-02：隐含赔率只影响跟注门槛，不改变实际 EV 公式
    expect(result.current.ev).toBeCloseTo(22, 6);
  });

  it('街道切到 turn：Rule of 2 使估算胜率减半，跟注转为亏损', () => {
    act(() => usePotOddsStore.getState().setStreet('turn'));
    const { result } = renderHook(() => useOddsCalculation());
    expect(result.current.estimatedEquity).toBeCloseTo(18, 6);
    expect(result.current.isProfitable).toBe(false);
    expect(result.current.ev).toBeCloseTo(-14, 6);
  });

  it('短牌变体使用 36 张牌组估算（9 outs flop ≈ 50.32%）', () => {
    act(() => usePotOddsStore.getState().setGameVariant('short-deck'));
    const { result } = renderHook(() => useOddsCalculation());
    expect(result.current.estimatedEquity).toBeCloseTo(50.3226, 4);
    expect(result.current.requiredEquity).toBeCloseTo(25, 6);
    expect(result.current.isProfitable).toBe(true);
  });

  it('随 store 参数变化实时重算', () => {
    const { result } = renderHook(() => useOddsCalculation());
    act(() => usePotOddsStore.getState().setOuts(4));
    expect(result.current.estimatedEquity).toBeCloseTo(16, 6);
    expect(result.current.isProfitable).toBe(false);

    act(() => usePotOddsStore.getState().setBetSize(25));
    expect(result.current.requiredEquity).toBeCloseTo((25 / 150) * 100, 6);
  });
});

describe('getEasyOddsQuestion（末题简单 + 补救固定题）', () => {
  it('返回占位 id=0 的免费看牌题：2 个选项、恰 1 个正确、全部为 i18n key', () => {
    const question = getEasyOddsQuestion();
    expect(question.id).toBe(0);
    expect(question.category).toBe('odds-judgment');
    expect(question.options).toHaveLength(2);
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1);

    const keys = [
      question.scenario,
      question.question,
      ...question.options.flatMap((o) => [o.text, o.explanation]),
    ];
    for (const key of keys) {
      expect(key.startsWith('potOdds.quizBank.easy.'), `非 easy 题 key：${key}`).toBe(true);
    }
  });

  it('选项顺序确定性：多次调用结果一致（补救题每次重渲染不换序）', () => {
    expect(getEasyOddsQuestion()).toEqual(getEasyOddsQuestion());
  });
});

describe('buildOddsFeedback（五级反馈映射）', () => {
  const cases: [boolean, number | undefined, DecisionGrade, number][] = [
    [true, undefined, 'best', 0],
    [false, undefined, 'wrong', 3],
    [true, 0.3, 'correct', 0.3],
    [false, 1, 'inaccuracy', 1],
    [false, 6, 'blunder', 6],
  ];

  it.each(cases)(
    'isCorrect=%s evLossOverride=%s → grade=%s / evLoss=%s',
    (isCorrect, override, grade, evLoss) => {
      const feedback = buildOddsFeedback(isCorrect, '跟注', override, '解析', 'l1-basics');
      expect(feedback.grade).toBe(grade);
      expect(feedback.evLoss).toBe(evLoss);
      expect(feedback.correctAction).toBe('跟注');
      expect(feedback.explanation).toBe('解析');
      expect(feedback.relatedLessonId).toBe('l1-basics');
    },
  );

  it('未提供 explanation 时回落为空串（不产生 undefined 文案）', () => {
    expect(buildOddsFeedback(true, '跟注').explanation).toBe('');
  });
});

describe('useOddsEloRecorder（math 维度）', () => {
  beforeEach(() => resetProgress());

  it('答对提升 math 评分，答错降低 math 评分，其他维度不变', () => {
    const { result } = renderHook(() => useOddsEloRecorder());
    const before = standardElo().math;

    act(() => result.current(true));
    const afterCorrect = standardElo();
    expect(afterCorrect.math).toBeGreaterThan(before);
    expect(afterCorrect.preflop).toBe(DEFAULT_ELO.preflop);
    expect(afterCorrect.gamesPlayed).toBe(1);

    act(() => resetProgress());
    act(() => result.current(false));
    expect(standardElo().math).toBeLessThan(before);
  });

  it('未显式传难度时按 math ELO 推断（1500 → 0.5）', () => {
    resetProgress(1500);
    const { result } = renderHook(() => useOddsEloRecorder());

    act(() => result.current(true));
    const inferred = standardElo().math;

    act(() => resetProgress(1500));
    act(() => result.current(true, 0.5));
    expect(standardElo().math).toBe(inferred);
  });

  it('难度入参 clamp 到 [0, 1]：5 等价于 1，-1 等价于 0', () => {
    const { result } = renderHook(() => useOddsEloRecorder());

    act(() => resetProgress());
    act(() => result.current(true, 5));
    const clampedHigh = standardElo().math;

    act(() => resetProgress());
    act(() => result.current(true, 1));
    expect(standardElo().math).toBe(clampedHigh);

    act(() => resetProgress());
    act(() => result.current(true, -1));
    const clampedLow = standardElo().math;

    act(() => resetProgress());
    act(() => result.current(true, 0));
    expect(standardElo().math).toBe(clampedLow);
  });
});

describe('useOddsSrsRecorder（复习队列）', () => {
  const question = QUIZ_QUESTIONS[0]!;

  beforeEach(() => resetProgress());

  it('首次答题创建 odds:<id> 复习项，载荷透传完整 i18n key', () => {
    const { result } = renderHook(() => useOddsSrsRecorder());
    act(() => result.current(question, true, 1000));

    const items = useProgressStore.getState().reviewItems;
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.id).toBe(`odds:${question.id}`);
    expect(item.category).toBe('odds');
    expect(item.label).toBe(question.scenario);
    expect(item.metadata?.front).toBe(question.question);
    expect(item.metadata?.source).toBe('odds');
    expect(item.metadata?.scenario).toBe(question.scenario);
    expect(item.metadata?.options).toHaveLength(question.options.length);
    expect(item.repetitions).toBe(1);
    expect(item.interval).toBe(1);
  });

  it('同一题再次答题原地更新，不产生重复复习项', () => {
    const { result } = renderHook(() => useOddsSrsRecorder());
    act(() => result.current(question, true, 1000));
    const afterFirst = useProgressStore.getState().reviewItems[0]!;

    act(() => result.current(question, false, 1000));
    const items = useProgressStore.getState().reviewItems;
    expect(items).toHaveLength(1);
    expect(items[0]!.id).toBe(afterFirst.id);
    // quality=1（答错）走有界回退：连续正确计数回退 1 步
    expect(items[0]!.repetitions).toBe(0);
    expect(items[0]!.easeFactor).toBeLessThan(afterFirst.easeFactor);
  });

  it('快答（<5s）按 quality=5 提升难度因子，慢答（≥5s）按 quality=4 保持不变', () => {
    const fast = renderHook(() => useOddsSrsRecorder());
    act(() => fast.result.current(question, true, 1000));
    const fastEase = useProgressStore.getState().reviewItems[0]!.easeFactor;

    act(() => resetProgress());
    const slow = renderHook(() => useOddsSrsRecorder());
    act(() => slow.result.current(question, true, 6000));
    const slowEase = useProgressStore.getState().reviewItems[0]!.easeFactor;

    expect(fastEase).toBeGreaterThan(slowEase);
  });
});

describe('useOddsEmotionRecorder（情绪与题量计数）', () => {
  beforeEach(() => resetProgress());

  it('连续答错累计 consecutiveWrongCount 并触发降级信号', () => {
    const { result } = renderHook(() => useOddsEmotionRecorder());
    act(() => result.current(false));
    act(() => result.current(false));
    expect(useProgressStore.getState().shouldDownshiftDifficulty()).toBe(false);

    act(() => result.current(false));
    const emotion = useProgressStore.getState().emotion;
    expect(emotion.consecutiveWrongCount).toBe(3);
    expect(emotion.dailyQuestionsAnswered).toBe(3);
    expect(emotion.dailyCorrect).toBe(0);
    expect(useProgressStore.getState().shouldDownshiftDifficulty()).toBe(true);
  });

  it('答对清零连续答错数并累计每日题量', () => {
    const { result } = renderHook(() => useOddsEmotionRecorder());
    act(() => result.current(false));
    act(() => result.current(true));

    const emotion = useProgressStore.getState().emotion;
    expect(emotion.consecutiveWrongCount).toBe(0);
    expect(emotion.dailyQuestionsAnswered).toBe(2);
    expect(emotion.dailyCorrect).toBe(1);
  });
});

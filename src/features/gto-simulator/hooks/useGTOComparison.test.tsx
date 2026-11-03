/**
 * useGTOComparison 家族 hook 测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 策略查找：命中 preflop 权威表 / 未覆盖 spot 返回 null（禁止降级为 open）
 *  - 记录器：ELO（postflop 维度）、SRS（复习项新建 vs 更新）、Emotion（连错计数）
 *  - buildGtoFeedback：evLoss → 五级 grade 映射与字段透传
 *  - getEasyGTOScenario：末题简单场景（BTN AA 纯 raise、描述存 i18n key）
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import type { Card, HandNotation } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { useProgressStore } from '@/features/progress/store';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { CompareResult } from '../utils/strategyCompare';
import { getPreflopHandStrategy } from '../utils/spotKey';
import {
  useGTOComparison,
  useGtoEloRecorder,
  useGtoSrsRecorder,
  useGtoEmotionRecorder,
  buildGtoFeedback,
  getEasyGTOScenario,
} from './useGTOComparison';

const HERO_AA: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.Ace },
];

const PREFLOP_FOLDS = [
  { position: Position.UTG, action: ActionType.Fold },
  { position: Position.HJ, action: ActionType.Fold },
  { position: Position.CO, action: ActionType.Fold },
];

function resetProgress(): void {
  const variantElo = (variant: 'standard' | 'short-deck' | 'heads-up'): EloRating => ({
    ...DEFAULT_ELO,
    variant,
  });
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: variantElo('standard'),
      'short-deck': variantElo('short-deck'),
      'heads-up': variantElo('heads-up'),
    },
    emotion: { ...DEFAULT_EMOTION_STATE },
    reviewItems: [],
  });
}

const standardElo = (): EloRating => useProgressStore.getState().eloByVariant.standard;

afterEach(() => {
  cleanup();
});

describe('useGTOComparison 策略查找', () => {
  beforeEach(resetProgress);

  it('手牌 / 位置缺失时全部派生值返回 null（不抛错）', () => {
    const { result } = renderHook(() => useGTOComparison(null, null));

    expect(result.current.handNotation).toBeNull();
    expect(result.current.gtoStrategy).toBeNull();
    expect(result.current.allStrategies).toBeNull();
    expect(result.current.optimalAction).toBeNull();
    expect(result.current.isPure).toBe(false);
    expect(result.current.evaluateDecision({ action: ActionType.Fold }, 6)).toBeNull();
  });

  it('BTN 前面全 fold 时命中 btn_open：AA 为纯 raise 且整表 169 手', () => {
    const { result } = renderHook(() =>
      useGTOComparison(HERO_AA, Position.BTN, PREFLOP_FOLDS),
    );

    expect(result.current.handNotation).toBe('AA');
    expect(result.current.gtoStrategy).toEqual(
      getPreflopHandStrategy(Position.BTN, PREFLOP_FOLDS, HERO_AA),
    );
    expect(result.current.allStrategies).not.toBeNull();
    expect(
      Object.keys(result.current.allStrategies as Record<HandNotation, unknown>),
    ).toHaveLength(169);
    expect(result.current.optimalAction?.action).toBe(ActionType.Raise);
    expect(result.current.isPure).toBe(true);
  });

  it('未覆盖 spot（HJ 面对 UTG open 冷跟）返回 null，不降级为 open 表', () => {
    const previousActions = [{ position: Position.UTG, action: ActionType.Raise, amount: 2.5 }];
    const { result } = renderHook(() =>
      useGTOComparison(HERO_AA, Position.HJ, previousActions),
    );

    expect(result.current.gtoStrategy).toBeNull();
    expect(result.current.allStrategies).toBeNull();
    expect(result.current.optimalAction).toBeNull();
  });

  it('evaluateDecision 用命中策略生成 EV 对比结果（fold 对 raise 策略为非最优）', () => {
    const { result } = renderHook(() =>
      useGTOComparison(HERO_AA, Position.BTN, PREFLOP_FOLDS),
    );

    const compared = result.current.evaluateDecision({ action: ActionType.Fold }, 6);

    expect(compared).not.toBeNull();
    expect(compared!.isOptimal).toBe(false);
    expect(compared!.evLoss).toBeGreaterThan(0.5);
    expect(compared!.userEV).toBe(0);
  });
});

describe('getEasyGTOScenario 末题简单场景', () => {
  it('返回 BTN 持 AA 的翻前 open 纯 raise 场景，文案存 i18n key', () => {
    const scenario = getEasyGTOScenario(3);

    expect(scenario.position).toBe(Position.BTN);
    expect(scenario.street).toBe('preflop');
    expect(scenario.heroHand).toEqual(HERO_AA);
    expect(scenario.id).toContain('3');
    // 持久化/复习项复用：不存中文原文，只存 key
    expect(scenario.description).toBe('gto.easyScenario.prompt');

    const node = scenario.decisionNodes![0]!;
    expect(node.gtoStrategy).toEqual({ fold: 0, call: 0, raise: 1, raiseAmount: 2.5 });
    expect(node.descriptionKey).toBe('gto.easyScenario.nodeDesc');
    expect(node.previousActions.every((action) => action.action === ActionType.Fold)).toBe(true);
  });
});

describe('useGtoEloRecorder（postflop 维度）', () => {
  beforeEach(resetProgress);

  it('答对且难度为字符串档位时 postflop 上升、gamesPlayed +1', () => {
    const before = standardElo();
    const { result } = renderHook(() => useGtoEloRecorder());

    act(() => result.current(true, 'beginner'));

    const after = standardElo();
    expect(after.postflop).toBeGreaterThan(before.postflop);
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    // 其他维度不受影响
    expect(after.preflop).toBe(before.preflop);
  });

  it('答错且难度越界时被钳制到 [0,1]，postflop 下降', () => {
    const before = standardElo();
    const { result } = renderHook(() => useGtoEloRecorder());

    act(() => result.current(false, 1.5));

    const after = standardElo();
    expect(after.postflop).toBeLessThan(before.postflop);
    expect(after.postflop).toBeGreaterThanOrEqual(0);
  });

  it('缺省难度时按当前 postflop ELO 推断（仍能完成更新）', () => {
    const before = standardElo();
    const { result } = renderHook(() => useGtoEloRecorder());

    act(() => result.current(true));

    expect(standardElo().gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(standardElo().postflop).not.toBe(before.postflop);
  });
});

describe('useGtoSrsRecorder（复习项）', () => {
  beforeEach(resetProgress);

  it('首次答题新建复习项：稳定 id + 静态 key 载荷 + quality 5', () => {
    const scenario = getEasyGTOScenario(0);
    const { result } = renderHook(() => useGtoSrsRecorder());

    act(() => result.current(scenario, true, 1000));

    const items = useProgressStore.getState().reviewItems;
    expect(items).toHaveLength(1);
    const item = items[0]!;
    expect(item.id).toBe('gto:btn_open:AA');
    expect(item.label).toBe('gto.review.label');
    expect(item.category).toBe('gto');
    expect(item.metadata?.source).toBe('gto');
    expect(item.metadata?.front).toBe('gto.review.front');
    expect(item.metadata?.back).toBe('gto.review.back.raise');
    expect(item.metadata?.params).toMatchObject({ position: 'BTN', hand: 'AA', amount: 2.5 });
    // 快答（<5s）+ 最优 → quality 5 → 连对计数 1
    expect(item.repetitions).toBe(1);
  });

  it('同一 spot + 手牌再次答题时原地推进已有复习项（不重复新增）', () => {
    const scenario = getEasyGTOScenario(0);
    // upsertReviewItem 的既有契约：命中同 id 时复用原项（label / metadata 保留），仅推进调度
    useProgressStore.setState({
      reviewItems: [
        createReviewItem('gto:btn_open:AA', 'gto.review.label', 'gto', {
          front: 'gto.review.front',
          back: 'gto.review.back.raise',
          source: 'gto',
        }),
      ],
    });
    const { result } = renderHook(() => useGtoSrsRecorder());

    act(() => result.current(scenario, true, 1000));

    const items = useProgressStore.getState().reviewItems;
    expect(items).toHaveLength(1);
    expect(items[0]!.repetitions).toBe(1);
    expect(items[0]!.lastReviewedAt).toBeTypeOf('number');
    expect(items[0]!.metadata?.back).toBe('gto.review.back.raise');
  });
});

describe('useGtoEmotionRecorder（情绪记录）', () => {
  beforeEach(resetProgress);

  it('连续答错累加 consecutiveWrongCount，答对清零', () => {
    const { result } = renderHook(() => useGtoEmotionRecorder());

    act(() => result.current(false));
    act(() => result.current(false));
    expect(useProgressStore.getState().emotion.consecutiveWrongCount).toBe(2);

    act(() => result.current(true));
    expect(useProgressStore.getState().emotion.consecutiveWrongCount).toBe(0);
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBe(3);
    expect(useProgressStore.getState().emotion.dailyCorrect).toBe(1);
  });
});

describe('buildGtoFeedback（五级评级）', () => {
  const base: CompareResult = {
    isOptimal: false,
    evLoss: 0,
    explanation: 'why',
    userEV: 0,
    optimalEV: 0,
    heroEquity: 0.5,
  };

  it.each([
    [0, 'best'],
    [0.3, 'correct'],
    [1, 'inaccuracy'],
    [3, 'wrong'],
    [6, 'blunder'],
  ] as const)('evLoss %s BB → grade %s', (evLoss, grade) => {
    expect(buildGtoFeedback({ ...base, evLoss }, 'fold').grade).toBe(grade);
  });

  it('透传 correctAction / explanation / relatedLessonId', () => {
    const feedback = buildGtoFeedback({ ...base, evLoss: 3 }, 'raise 2.5BB', 'l3-cbet');

    expect(feedback).toEqual({
      grade: 'wrong',
      evLoss: 3,
      correctAction: 'raise 2.5BB',
      explanation: 'why',
      relatedLessonId: 'l3-cbet',
    });
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating, PokerVariant } from '@/shared/types/elo';
import { useProgressStore } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { useRangeTrainerStore, INITIAL_QUIZ_STATE } from '../store';
import type { QuizQuestion } from '../types';
import { useQuizEngine } from './useQuizEngine';

const question: QuizQuestion = {
  hand: 'AA',
  position: Position.BB,
  correctAction: 'call',
  context: 'BB call-vs-raise',
};

function variantElo(variant: PokerVariant): EloRating {
  return { ...DEFAULT_ELO, variant };
}

function resetStores(): void {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    quizState: { ...INITIAL_QUIZ_STATE, actionType: 'call-vs-raise', status: 'running' },
  });
  useProgressStore.setState({
    activeVariant: 'standard',
    reviewItems: [],
    emotion: { ...DEFAULT_EMOTION_STATE },
    eloByVariant: {
      standard: variantElo('standard'),
      'short-deck': variantElo('short-deck'),
      'heads-up': variantElo('heads-up'),
    },
  });
}

describe('useQuizEngine SRS 复合键', () => {
  beforeEach(resetStores);
  afterEach(() => {
    cleanup();
    resetStores();
  });

  it('同一位置和手牌跨动作类型不覆盖，metadata.params 同步动作', () => {
    const { result } = renderHook(() => useQuizEngine());
    act(() => result.current.recordSrsForAnswer(question, true, 1000));

    act(() => {
      useRangeTrainerStore.setState({
        quizState: { ...useRangeTrainerStore.getState().quizState, actionType: '3bet' },
      });
    });
    act(() => result.current.recordSrsForAnswer(
      { ...question, correctAction: 'raise', context: 'BB 3bet' },
      true,
      1000,
    ));

    const items = useProgressStore.getState().reviewItems;
    expect(items.map((item) => item.id)).toEqual([
      'range:standard:call-vs-raise:BB:AA',
      'range:standard:3bet:BB:AA',
    ]);
    expect(items[0]?.metadata?.params).toEqual({
      variant: 'standard',
      actionType: 'call-vs-raise',
      position: Position.BB,
      hand: 'AA',
    });
    expect(items[1]?.metadata?.params?.actionType).toBe('3bet');
  });

  it('同一位置和手牌跨变体不覆盖，metadata.params 同步变体', () => {
    const { result } = renderHook(() => useQuizEngine());
    act(() => result.current.recordSrsForAnswer(question, true, 1000));

    act(() => {
      useRangeTrainerStore.setState({ gameVariant: 'short-deck' });
    });
    act(() => result.current.recordSrsForAnswer(question, true, 1000));

    const items = useProgressStore.getState().reviewItems;
    expect(items.map((item) => item.id)).toEqual([
      'range:standard:call-vs-raise:BB:AA',
      'range:short-deck:call-vs-raise:BB:AA',
    ]);
    expect(items[1]?.metadata?.params?.variant).toBe('short-deck');
  });

  it('复合键完全相同时原地推进已有复习项', () => {
    const { result } = renderHook(() => useQuizEngine());
    act(() => result.current.recordSrsForAnswer(question, true, 1000));
    act(() => result.current.recordSrsForAnswer(question, true, 1000));

    const items = useProgressStore.getState().reviewItems;
    expect(items).toHaveLength(1);
    expect(items[0]?.repetitions).toBe(2);
  });
});

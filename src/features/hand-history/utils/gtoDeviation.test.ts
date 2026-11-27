import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import {
  analyzeHandDeviations,
  clearDeviationCache,
  DEVIATION_UNAVAILABLE,
  getDeviationSummary,
  type DeviationDecision,
  type DeviationResult,
} from './gtoDeviation';

// P1-01 修复回归：getDeviationSummary 最优数统计必须使用五级体系中的 'best'。
// 修复前用已废弃的 'optimal' 值过滤，导致 optimalCount 恒为 0、最优率永远显示 0%。
// 可用性回归：Worker 不可用的决策必须被排除在统计之外，失败路径不得伪装成 best。

function makeDecision(overrides: Partial<DeviationDecision> = {}): DeviationDecision {
  return {
    street: 'flop',
    action: 'call',
    gtoAction: 'raise',
    evLoss: 0,
    grade: 'best',
    available: true,
    ...overrides,
  };
}

function makeResult(decisions: DeviationDecision[]): DeviationResult {
  return { handId: 'h1', analyzedAt: 0, deviations: decisions };
}

describe('getDeviationSummary（P1-01 grade=best 统计）', () => {
  it('包含 best 决策时 optimalCount > 0', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ grade: 'best' }),
      makeDecision({ grade: 'correct', evLoss: 3 }),
      makeDecision({ grade: 'wrong', evLoss: 3 }),
    ]));
    expect(summary.totalDecisions).toBe(3);
    expect(summary.availableTotal).toBe(3);
    expect(summary.unavailableCount).toBe(0);
    expect(summary.optimalCount).toBe(1);
  });

  it('无 best 决策时 optimalCount === 0', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ grade: 'correct', evLoss: 3 }),
      makeDecision({ grade: 'inaccuracy', evLoss: 3 }),
      makeDecision({ grade: 'blunder', evLoss: 3 }),
    ]));
    expect(summary.optimalCount).toBe(0);
  });

  it('全部 best 时 optimalCount 等于总数', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ grade: 'best' }),
      makeDecision({ grade: 'best' }),
      makeDecision({ grade: 'best' }),
    ]));
    expect(summary.optimalCount).toBe(3);
  });

  it('averageEvLoss 正确计算（best 为 0）', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ grade: 'best' }),
      makeDecision({ grade: 'correct', evLoss: 3 }),
    ]));
    expect(summary.averageEvLoss).toBe(1.5);
  });
});

describe('getDeviationSummary（可用性口径）', () => {
  it('不可用决策不计入 optimalCount / averageEvLoss / worstDecision，只计入 unavailableCount', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ street: 'flop', grade: 'best', evLoss: 0 }),
      // 不可用项即便带有历史脏 EV，也不得成为最差决策或进入平均
      makeDecision({ street: 'turn', available: false, grade: DEVIATION_UNAVAILABLE, gtoAction: DEVIATION_UNAVAILABLE, evLoss: 99 }),
      makeDecision({ street: 'river', grade: 'blunder', evLoss: 6 }),
    ]));

    expect(summary.totalDecisions).toBe(3);
    expect(summary.availableTotal).toBe(2);
    expect(summary.unavailableCount).toBe(1);
    expect(summary.optimalCount).toBe(1);
    expect(summary.averageEvLoss).toBe(3);
    expect(summary.worstDecision).toEqual({ street: 'river', evLoss: 6 });
  });

  it('全部不可用时 averageEvLoss 为 0、worstDecision 为 null、optimalCount 为 0', () => {
    const summary = getDeviationSummary(makeResult([
      makeDecision({ available: false, grade: DEVIATION_UNAVAILABLE, gtoAction: DEVIATION_UNAVAILABLE, evLoss: 0 }),
      makeDecision({ street: 'river', available: false, grade: DEVIATION_UNAVAILABLE, gtoAction: DEVIATION_UNAVAILABLE, evLoss: 0 }),
    ]));

    expect(summary).toEqual({
      totalDecisions: 2,
      availableTotal: 0,
      unavailableCount: 2,
      optimalCount: 0,
      averageEvLoss: 0,
      worstDecision: null,
    });
  });

  it('缺失 available 字段的旧结构按不可用处理（不默认放行）', () => {
    const legacy = {
      street: 'flop',
      action: 'call',
      gtoAction: 'call',
      evLoss: 0,
      grade: 'best',
    } as unknown as DeviationDecision;
    const summary = getDeviationSummary(makeResult([legacy]));
    expect(summary.availableTotal).toBe(0);
    expect(summary.optimalCount).toBe(0);
  });
});

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(id: string): HandHistory {
  return {
    id,
    site: 'pokerstars',
    handNumber: `HN-${id}`,
    timestamp: 1_700_000_000_000,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      {
        id: 0,
        name: 'Hero',
        position: Position.BTN,
        seatNumber: 1,
        stack: 200,
        holeCards: [c(Rank.Ace, Suit.Hearts), c(Rank.King, Suit.Hearts)],
      },
      { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 200 },
    ],
    board: [],
    streets: {
      preflop: [{ type: ActionType.Raise, amount: 3, playerIndex: 0 }],
      flop: { cards: [], actions: [{ type: ActionType.Check, playerIndex: 0 }] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 20,
    heroPlayerId: 0,
    annotations: {},
  };
}

describe('analyzeHandDeviations（Worker 不可用 fallback）', () => {
  beforeEach(() => {
    vi.stubGlobal('requestIdleCallback', (fn: () => void) => { fn(); });
    // Node 无 Worker 全局：getWorker 构造失败 → 走 fallback 通道
    vi.stubGlobal('Worker', undefined);
    clearDeviationCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearDeviationCache();
  });

  it('fallback 不再伪造 best/call：全部决策标记 available:false 与 unavailable 哨兵', async () => {
    const results = await analyzeHandDeviations([makeHand('fb1')], 'Hero');

    expect(results).toHaveLength(1);
    const decisions = results[0]!.deviations;
    expect(decisions).toHaveLength(2);
    for (const d of decisions) {
      expect(d.available).toBe(false);
      expect(d.gtoAction).toBe(DEVIATION_UNAVAILABLE);
      expect(d.grade).toBe(DEVIATION_UNAVAILABLE);
      expect(d.evLoss).toBe(0);
    }
  });

  it('fallback 结果的 summary 不产生最优率与最差决策', async () => {
    const [result] = await analyzeHandDeviations([makeHand('fb2')], 'Hero');
    const summary = getDeviationSummary(result!);

    expect(summary.totalDecisions).toBe(2);
    expect(summary.availableTotal).toBe(0);
    expect(summary.unavailableCount).toBe(2);
    expect(summary.optimalCount).toBe(0);
    expect(summary.averageEvLoss).toBe(0);
    expect(summary.worstDecision).toBeNull();
  });
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import type { DeviationResult } from './gtoDeviation';

/**
 * gtoDeviation 分析管线测试（L1）。
 *
 * Worker 属系统边界：Node 环境无 Worker 全局 → 走 fallback；测试按需 stub 全局 Worker
 * 以覆盖「成功回传 / 崩溃 / 超时」三条通道。每个用例重置模块，避免模块级 workerRef
 * 与 analysisCache 跨用例泄漏。
 */

type DeviationModule = typeof import('./gtoDeviation');

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(id: string, overrides: Partial<HandHistory> = {}): HandHistory {
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
      preflop: [
        { type: ActionType.Raise, amount: 3, playerIndex: 0 },
        { type: ActionType.Call, amount: 3, playerIndex: 1 },
      ],
      flop: {
        cards: [c(Rank.Two, Suit.Clubs), c(Rank.Seven, Suit.Diamonds), c(Rank.Nine, Suit.Spades)],
        actions: [
          { type: ActionType.Check, playerIndex: 0 },
          { type: ActionType.Fold, playerIndex: 1 },
        ],
      },
      turn: { cards: [c(Rank.Four, Suit.Hearts)], actions: [{ type: ActionType.Call, amount: 2, playerIndex: 0 }] },
      river: { cards: [c(Rank.Five, Suit.Spades)], actions: [{ type: ActionType.AllIn, amount: 10, playerIndex: 0 }] },
    },
    pot: 20,
    annotations: {},
    ...overrides,
  };
}

let mod: DeviationModule;

async function loadModule(): Promise<DeviationModule> {
  vi.resetModules();
  mod = await import('./gtoDeviation');
  return mod;
}

/** 让 requestIdleCallback 立即可用（默认 Node 无该 API，会退化为 16ms setTimeout） */
function stubSyncIdle(): void {
  vi.stubGlobal('requestIdleCallback', (fn: () => void) => { fn(); });
}

beforeEach(async () => {
  stubSyncIdle();
  await loadModule();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('analyzeHandDeviations（Worker 不可用时的 fallback）', () => {
  it('按街顺序提取 hero 决策，fallback 全部判为 best / 0 EV 损失', async () => {
    const onProgress = vi.fn();
    const results = await mod.analyzeHandDeviations([makeHand('h1')], 'Hero', onProgress);

    expect(results).toHaveLength(1);
    const deviations = results[0]!.deviations;
    expect(deviations.map(d => d.street)).toEqual(['preflop', 'flop', 'turn', 'river']);
    expect(deviations.map(d => d.action)).toEqual(['raise', 'check', 'call', 'all-in']);
    expect(deviations.every(d => d.gtoAction === 'call' && d.evLoss === 0 && d.grade === 'best')).toBe(true);
    expect(onProgress).toHaveBeenLastCalledWith(1, 1);
  });

  it('heroPlayerId 名称不匹配的牌局不落入结果（避免脏数据占用统计分母）', async () => {
    const results = await mod.analyzeHandDeviations([makeHand('h2')], 'SomeoneElse');
    expect(results).toEqual([]);
  });

  it('hero 无任何动作的牌局同样不产出结果', async () => {
    const hand = makeHand('h3', {
      streets: {
        preflop: [],
        flop: { cards: [], actions: [] },
        turn: { cards: [], actions: [] },
        river: { cards: [], actions: [] },
      },
    });
    expect(await mod.analyzeHandDeviations([hand], 'Hero')).toEqual([]);
  });

  it('结果写入缓存：getCachedDeviation 可取回，clearDeviationCache 清空，重复分析跳过', async () => {
    await mod.analyzeHandDeviations([makeHand('h4')], 'Hero');
    expect(mod.getCachedDeviation('h4')?.handId).toBe('h4');

    // 已缓存手牌再次分析：全部命中缓存，不再提取决策（total = 已完成手牌数）
    const onProgress = vi.fn();
    const cachedOnly = await mod.analyzeHandDeviations([makeHand('h4')], 'Hero', onProgress);
    expect(cachedOnly).toHaveLength(1);
    expect(onProgress).toHaveBeenLastCalledWith(1, 1);

    mod.clearDeviationCache();
    expect(mod.getCachedDeviation('h4')).toBeUndefined();
  });

  it('部分命中缓存时只为未缓存手牌提取决策', async () => {
    await mod.analyzeHandDeviations([makeHand('h5')], 'Hero');
    const onProgress = vi.fn();
    const results = await mod.analyzeHandDeviations([makeHand('h5'), makeHand('h6')], 'Hero', onProgress);
    // 进度分母只统计未缓存手牌（h6）
    expect(onProgress).toHaveBeenLastCalledWith(1, 1);
    expect(results.map(r => r.handId)).toEqual(['h6']);
  });

  it('手牌无底牌时用 fallback 记法（AA）继续分析，不抛错', async () => {
    const hand = makeHand('h7', {
      players: [
        { id: 0, name: 'Hero', position: Position.BTN, seatNumber: 1, stack: 200 },
        { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 200 },
      ],
    });
    const results = await mod.analyzeHandDeviations([hand], 'Hero');
    expect(results[0]!.deviations).toHaveLength(4);
  });
});

describe('analyzeHandDeviations（Worker 可用）', () => {
  class ReplyingWorker {
    static last: ReplyingWorker | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    terminated = false;
    constructor() { ReplyingWorker.last = this; }
    postMessage(msg: { id: number; payload: Array<{ id: string }> }): void {
      const result = msg.payload.map((p, i) => ({
        id: p.id,
        gtoAction: i % 2 === 0 ? 'raise' : 'fold',
        evLoss: i % 2 === 0 ? 0 : 3.5,
        grade: i % 2 === 0 ? 'best' : 'inaccuracy',
      }));
      this.onmessage?.({ data: { id: msg.id, result } } as MessageEvent);
    }
    terminate(): void { this.terminated = true; }
  }

  class EmptyReplyingWorker {
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    postMessage(msg: { id: number }): void {
      this.onmessage?.({ data: { id: msg.id, result: [] } } as MessageEvent);
    }
    terminate(): void {}
  }

  it('Worker 回传结果按批次顺序映射到对应决策', async () => {
    vi.stubGlobal('Worker', ReplyingWorker);
    await loadModule();

    const results = await mod.analyzeHandDeviations([makeHand('w1')], 'Hero');
    const deviations = results[0]!.deviations;
    expect(deviations.map(d => d.grade)).toEqual(['best', 'inaccuracy', 'best', 'inaccuracy']);
    expect(deviations.map(d => d.gtoAction)).toEqual(['raise', 'fold', 'raise', 'fold']);
    expect(deviations[1]!.evLoss).toBe(3.5);
  });

  it('Worker 回传结果条数不足时按保守默认值补齐（call / 0 / best）', async () => {
    vi.stubGlobal('Worker', EmptyReplyingWorker);
    await loadModule();

    const results = await mod.analyzeHandDeviations([makeHand('w2')], 'Hero');
    expect(results[0]!.deviations.every(d => d.grade === 'best' && d.evLoss === 0 && d.gtoAction === 'call')).toBe(true);
  });
});

describe('analyzeHandDeviations（Worker 异常通道）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('Worker 崩溃时悬挂请求立即走 fallback（修复前 pending.clear 使超时定时器失效 → 永久挂起）', async () => {
    class CrashingWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      terminate(): void {}
      postMessage(): void {
        // 真实 worker 的错误是异步事件；这里用 microtask 模拟同一时序
        queueMicrotask(() => this.onerror?.());
      }
    }
    vi.stubGlobal('Worker', CrashingWorker);
    await loadModule();

    const captured: { value: DeviationResult[] | null } = { value: null };
    const analysis = mod
      .analyzeHandDeviations([makeHand('c1')], 'Hero')
      .then((results) => { captured.value = results; return results; });

    const settled = await Promise.race([
      analysis.then(() => 'resolved' as const),
      vi.advanceTimersByTimeAsync(11_000).then(() => 'hung' as const),
    ]);

    expect(settled).toBe('resolved');
    expect(captured.value).not.toBeNull();
    expect(captured.value![0]!.deviations.every(d => d.grade === 'best')).toBe(true);
  });

  it('Worker 无响应时 10s 超时走 fallback，不永久等待', async () => {
    class SilentWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      terminate(): void {}
      postMessage(): void { /* 永不回传 */ }
    }
    vi.stubGlobal('Worker', SilentWorker);
    await loadModule();

    const captured: { value: DeviationResult[] | null } = { value: null };
    const analysis = mod
      .analyzeHandDeviations([makeHand('c2')], 'Hero')
      .then((results) => { captured.value = results; return results; });

    const settled = await Promise.race([
      analysis.then(() => 'resolved' as const),
      vi.advanceTimersByTimeAsync(11_000).then(() => 'hung' as const),
    ]);

    expect(settled).toBe('resolved');
    expect(captured.value![0]!.deviations).toHaveLength(4);
  });
});

describe('getDeviationSummary 最差决策', () => {
  it('取 EV 损失最大的决策；无决策时 worstDecision 为 null', () => {
    const result: DeviationResult = {
      handId: 's1',
      analyzedAt: 0,
      deviations: [
        { street: 'flop', action: 'call', gtoAction: 'raise', evLoss: 1, grade: 'inaccuracy' },
        { street: 'river', action: 'fold', gtoAction: 'call', evLoss: 6, grade: 'blunder' },
      ],
    };
    expect(mod.getDeviationSummary(result).worstDecision).toEqual({ street: 'river', evLoss: 6 });
    expect(mod.getDeviationSummary({ handId: 's2', analyzedAt: 0, deviations: [] })).toEqual({
      totalDecisions: 0,
      optimalCount: 0,
      averageEvLoss: 0,
      worstDecision: null,
    });
  });
});

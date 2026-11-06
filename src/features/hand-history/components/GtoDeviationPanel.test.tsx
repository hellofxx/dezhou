import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import { analyzeHandDeviations, clearDeviationCache } from '../utils/gtoDeviation';
import { GtoDeviationPanel } from './GtoDeviationPanel';

/**
 * GTO 偏差面板冒烟（jsdom）。
 * 覆盖：分析中态 → 有数据态、统计口径（决策数 / 最优率 / 平均与最差 EV）、
 * 五级评级文案、逐街对比行、整体评估条、无 hero 决策时整块不渲染。
 * Worker 属系统边界：本文件 stub 全局 Worker 以固定回传结果，避免依赖真实 worker 线程。
 */

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(overrides: Partial<HandHistory> = {}): HandHistory {
  return {
    id: 'g1',
    site: 'pokerstars',
    handNumber: 'G1',
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
    board: [c(Rank.Two, Suit.Clubs), c(Rank.Seven, Suit.Diamonds), c(Rank.Nine, Suit.Spades)],
    streets: {
      preflop: [{ type: ActionType.Raise, amount: 3, playerIndex: 0 }],
      flop: {
        cards: [c(Rank.Two, Suit.Clubs), c(Rank.Seven, Suit.Diamonds), c(Rank.Nine, Suit.Spades)],
        actions: [{ type: ActionType.Check, playerIndex: 0 }],
      },
      turn: { cards: [c(Rank.Four, Suit.Hearts)], actions: [{ type: ActionType.Call, amount: 2, playerIndex: 0 }] },
      river: { cards: [c(Rank.Five, Suit.Spades)], actions: [{ type: ActionType.AllIn, amount: 10, playerIndex: 0 }] },
    },
    pot: 20,
    heroPlayerId: 0,
    annotations: {},
    ...overrides,
  };
}

interface WorkerResult {
  id: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
}

let nextResults: WorkerResult[] = [];

/** 固定回传 nextResults（按批次顺序映射到决策）；worker 实例跨用例复用。 */
class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate(): void {}
  postMessage(msg: { id: number }): void {
    this.onmessage?.({ data: { id: msg.id, result: nextResults } } as MessageEvent);
  }
}

function stubSyncIdle(): void {
  vi.stubGlobal('requestIdleCallback', (fn: () => void) => { fn(); });
}

/** 让 analyzeHandDeviations 的异步链路跑完（idle 回调 + 微任务） */
async function flushAnalysis(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(50);
  });
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  clearDeviationCache();
  nextResults = [];
  vi.useFakeTimers();
  stubSyncIdle();
  vi.stubGlobal('Worker', FakeWorker);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  clearDeviationCache();
});

describe('GtoDeviationPanel', () => {
  it('初次渲染显示分析中，分析完成后渲染统计与逐街对比', async () => {
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    expect(screen.getByText(i18n.t('handHistory.deviation.loading'))).not.toBeNull();

    await flushAnalysis();

    expect(screen.getByText(i18n.t('handHistory.deviation.title'))).not.toBeNull();
    // fallback 结果（无 worker 回传时默认 best / 0 EV）
    expect(screen.getByText(i18n.t('handHistory.deviation.decisions'))).not.toBeNull();
    expect(screen.getByText('4')).not.toBeNull();

    // StatBox 保留本地实现：紧凑内联指标（text-sm 数值），不走 shared StatCard 的 sm(text-lg) 档
    const box = screen.getByText(i18n.t('handHistory.deviation.decisions')).parentElement as HTMLElement;
    const boxValue = box.firstElementChild as HTMLElement;
    expect(boxValue.textContent).toBe('4');
    expect(boxValue.className).toContain('text-sm');
    expect(boxValue.className).toContain('font-numeric');
    expect(screen.getByText('100%')).not.toBeNull();
    // 平均 EV 损失与最差决策均为 0
    expect(screen.getAllByText('0BB')).toHaveLength(2);
    expect(screen.queryByText('—')).toBeNull();
  });

  it('按回传结果渲染最优率 / 平均与最差 EV，以及五级评级文案', async () => {
    nextResults = [
      { id: '0', gtoAction: 'raise', evLoss: 0, grade: 'best' },
      { id: '1', gtoAction: 'raise', evLoss: 1.5, grade: 'inaccuracy' },
      { id: '2', gtoAction: 'fold', evLoss: 5, grade: 'wrong' },
      { id: '3', gtoAction: 'call', evLoss: 9, grade: 'blunder' },
    ];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    // 1/4 最优 → 25%；平均 (0+1.5+5+9)/4 = 3.88；最差 9
    expect(screen.getByText('25%')).not.toBeNull();
    expect(screen.getByText('3.88BB')).not.toBeNull();
    expect(screen.getByText('9BB')).not.toBeNull();

    const text = document.body.textContent ?? '';
    expect(text).toContain(i18n.t('feedback.grade.inaccuracy'));
    expect(text).toContain(i18n.t('feedback.grade.wrong'));
    expect(text).toContain(i18n.t('feedback.grade.blunder'));
    expect(text).toContain(i18n.t('handHistory.deviation.youActed', { action: 'all-in' }));
    expect(text).toContain(i18n.t('handHistory.deviation.gtoActed', { action: 'call' }));

    // 损失行与整体评估条
    expect(text).toContain('-5BB');
    expect(text).toContain(i18n.t('handHistory.deviation.avgLossPerHand', { evLoss: 3.88 }));
    expect(text).toContain(
      i18n.t('handHistory.deviation.worstOnStreet', { street: 'river' }),
    );
  });

  it('命中缓存时不再展示分析中态', async () => {
    await analyzeHandDeviations([makeHand()], 'Hero');
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);

    expect(screen.queryByText(i18n.t('handHistory.deviation.loading'))).toBeNull();
    expect(screen.getByText(i18n.t('handHistory.deviation.title'))).not.toBeNull();
  });

  it('hero 无决策（名称不匹配）时整块不渲染', async () => {
    render(<GtoDeviationPanel hand={makeHand()} heroName="Nobody" />);
    await flushAnalysis();

    expect(document.body.textContent).toBe('');
  });
});

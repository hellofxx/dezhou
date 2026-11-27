import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import zhHandHistory from '@/i18n/locales/zh/handHistory.json';
import enHandHistory from '@/i18n/locales/en/handHistory.json';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import { analyzeHandDeviations, clearDeviationCache } from '../utils/gtoDeviation';
import { GtoDeviationPanel } from './GtoDeviationPanel';

/**
 * 策略偏差面板冒烟（jsdom）。标题与文案为「启发式，非求解器 GTO」诚实口径。
 * 覆盖：分析中态 → 有数据态、统计口径（决策数 / 最优率 / 平均与最差 EV）、
 * 五级评级文案、逐街对比行、整体评估条、无 hero 决策时整块不渲染，
 * 以及 Worker 结果不可用时（全部 / 部分 / 崩溃 / 回传不足）不得伪造最优率与 EV。
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
  available: boolean;
}

function workerRow(overrides: Partial<WorkerResult> = {}): WorkerResult {
  return { id: '0', gtoAction: 'raise', evLoss: 0, grade: 'best', available: true, ...overrides };
}

function unavailableRow(id: string): WorkerResult {
  return { id, gtoAction: 'unavailable', evLoss: 0, grade: 'unavailable', available: false };
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

/** 模拟 worker 崩溃：构造后立即触发 onerror，分析管线应走 available:false fallback。 */
class CrashingWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate(): void {}
  postMessage(): void {
    this.onerror?.();
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

function bodyText(): string {
  return document.body.textContent ?? '';
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
    nextResults = [workerRow(), workerRow({ id: '1' }), workerRow({ id: '2' }), workerRow({ id: '3' })];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    expect(screen.getByText(i18n.t('handHistory.deviation.loading'))).not.toBeNull();

    await flushAnalysis();

    expect(screen.getByText(i18n.t('handHistory.deviation.title'))).not.toBeNull();
    // 诚实口径说明必须与标题同时出现
    expect(screen.getByText(i18n.t('handHistory.deviation.heuristicNote'))).not.toBeNull();
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
    // 无不可用项时不出现不可用提示
    expect(screen.queryByText(i18n.t('handHistory.deviation.unavailable.title'))).toBeNull();
  });

  it('按回传结果渲染最优率 / 平均与最差 EV，以及五级评级文案', async () => {
    nextResults = [
      { id: '0', gtoAction: 'raise', evLoss: 0, grade: 'best', available: true },
      { id: '1', gtoAction: 'raise', evLoss: 1.5, grade: 'inaccuracy', available: true },
      { id: '2', gtoAction: 'fold', evLoss: 5, grade: 'wrong', available: true },
      { id: '3', gtoAction: 'call', evLoss: 9, grade: 'blunder', available: true },
    ];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    // 1/4 最优 → 25%；平均 (0+1.5+5+9)/4 = 3.88；最差 9
    expect(screen.getByText('25%')).not.toBeNull();
    expect(screen.getByText('3.88BB')).not.toBeNull();
    expect(screen.getByText('9BB')).not.toBeNull();

    const text = bodyText();
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

  it('全部不可用：显示「分析暂不可用」状态，不渲染最优率 / EV / 伪造建议', async () => {
    nextResults = [unavailableRow('0'), unavailableRow('1'), unavailableRow('2'), unavailableRow('3')];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    const status = screen.getByRole('status');
    expect(status.textContent).toContain(i18n.t('handHistory.deviation.unavailable.title'));
    expect(status.textContent).toContain(i18n.t('handHistory.deviation.unavailable.description'));
    expect(status.textContent).toContain(
      i18n.t('handHistory.deviation.unavailable.count', { count: 4 }),
    );

    // 不显示假的统计口径
    expect(screen.queryByText(i18n.t('handHistory.deviation.optimal'))).toBeNull();
    expect(screen.queryByText(i18n.t('handHistory.deviation.avgEvLoss'))).toBeNull();
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.queryByText('0BB')).toBeNull();

    // 逐街行仍保留，但只标不可用，不出现 GTO 建议
    const text = bodyText();
    expect(text).not.toContain(i18n.t('handHistory.deviation.gtoActed', { action: 'unavailable' }));
    expect(text).not.toContain(i18n.t('feedback.grade.best'));
    expect(screen.getAllByText(i18n.t('handHistory.deviation.unavailable.row'))).toHaveLength(4);
  });

  it('部分不可用：统计只基于可用项并显示不可用数量', async () => {
    nextResults = [
      { id: '0', gtoAction: 'raise', evLoss: 0, grade: 'best', available: true },
      { id: '1', gtoAction: 'raise', evLoss: 2, grade: 'inaccuracy', available: true },
      unavailableRow('2'),
      unavailableRow('3'),
    ];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    // 可用 2 条中 1 条最优 → 50%；平均 (0+2)/2 = 1；最差 2
    expect(screen.getByText('50%')).not.toBeNull();
    expect(screen.getByText('1BB')).not.toBeNull();
    expect(screen.getByText('2BB')).not.toBeNull();
    // 决策数只数可用项
    const box = screen.getByText(i18n.t('handHistory.deviation.decisions')).parentElement as HTMLElement;
    expect((box.firstElementChild as HTMLElement).textContent).toBe('2');

    expect(
      screen.getByText(i18n.t('handHistory.deviation.partialUnavailable', { unavailable: 2, total: 4 })),
    ).not.toBeNull();
    expect(screen.getAllByText(i18n.t('handHistory.deviation.unavailable.row'))).toHaveLength(2);
    // 不可用项不得进入最优率分母（否则会变成 25%）
    expect(screen.queryByText('25%')).toBeNull();
  });

  it('Worker 回传条数不足时不补齐 best，剩余决策标记不可用', async () => {
    nextResults = [];
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    expect(screen.getByRole('status').textContent).toContain(i18n.t('handHistory.deviation.unavailable.title'));
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.queryByText('0BB')).toBeNull();
  });

  it('Worker 崩溃时走 fallback，面板显示不可用状态而不是满分', async () => {
    vi.stubGlobal('Worker', CrashingWorker);
    render(<GtoDeviationPanel hand={makeHand()} heroName="Hero" />);
    await flushAnalysis();

    expect(screen.getByRole('status').textContent).toContain(i18n.t('handHistory.deviation.unavailable.title'));
    expect(screen.queryByText('100%')).toBeNull();
    expect(screen.getAllByText(i18n.t('handHistory.deviation.unavailable.row'))).toHaveLength(4);
  });

  it('命中缓存时不再展示分析中态', async () => {
    nextResults = [workerRow(), workerRow({ id: '1' }), workerRow({ id: '2' }), workerRow({ id: '3' })];
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

describe('handHistory.deviation i18n 文案', () => {
  const KEYS = [
    'title',
    'heuristicNote',
    'decisions',
    'optimal',
    'avgEvLoss',
    'worstDecision',
    'loadingWithProgress',
    'streetComparison',
    'youActed',
    'gtoActed',
    'partialUnavailable',
    'unavailable.title',
    'unavailable.description',
    'unavailable.count_one',
    'unavailable.count_other',
    'unavailable.row',
  ] as const;

  function read(copy: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      copy,
    );
  }

  it('zh / en 均存在全部 deviation key 且为非空字符串', () => {
    for (const [lng, bundle] of [['zh', zhHandHistory], ['en', enHandHistory]] as const) {
      for (const key of KEYS) {
        const value = read(bundle.deviation, key);
        expect(typeof value, `${lng} handHistory.deviation.${key} 缺失`).toBe('string');
        expect((value as string).length, `${lng} handHistory.deviation.${key} 为空`).toBeGreaterThan(0);
      }
    }
  });

  it('按语言解析真实文案（不回退为 key）', () => {
    for (const lng of ['zh', 'en'] as const) {
      for (const key of ['title', 'heuristicNote', 'unavailable.title'] as const) {
        expect(i18n.t(`handHistory.deviation.${key}`, { lng })).not.toBe(`handHistory.deviation.${key}`);
      }
    }
  });
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from '../store';
import type { HandHistory } from '../types';
import { clearDeviationCache } from '../utils/gtoDeviation';
import { HandReplayer } from './HandReplayer';

/**
 * 回放页主视图冒烟（jsdom）。
 * 覆盖：未加载空态、头部信息与底池、上一步/下一步与底池联动、播放/暂停按钮、
 * 倍速选择高亮、街道跳转联动批注面板与回放状态、hero 识别（heroPlayerId 优先 / 底牌回退）。
 * 未覆盖（L4）：椭圆座位视觉、动效与真实计时播放观感。
 */

MotionGlobalConfig.skipAnimations = true;

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(overrides: Partial<HandHistory> = {}): HandHistory {
  return {
    id: 'p1',
    site: 'pokerstars',
    handNumber: 'P-1',
    timestamp: new Date(2024, 0, 15, 20, 30).getTime(),
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      {
        id: 0,
        name: 'Alice',
        position: Position.BTN,
        seatNumber: 1,
        stack: 100,
        holeCards: [c(Rank.Ace, Suit.Hearts), c(Rank.King, Suit.Hearts)],
      },
      { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [c(Rank.Two, Suit.Clubs), c(Rank.Seven, Suit.Diamonds), c(Rank.Nine, Suit.Spades)],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Call, amount: 6, playerIndex: 1 },
      ],
      flop: {
        cards: [c(Rank.Two, Suit.Clubs), c(Rank.Seven, Suit.Diamonds), c(Rank.Nine, Suit.Spades)],
        actions: [{ type: ActionType.Raise, amount: 4, playerIndex: 0 }],
      },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 16,
    heroPlayerId: 0,
    annotations: {},
    ...overrides,
  };
}

function button(label: string): HTMLButtonElement {
  const found = screen.getAllByRole('button').find(b => b.getAttribute('aria-label') === label);
  expect(found, `缺少按钮 ${label}`).not.toBeUndefined();
  return found as HTMLButtonElement;
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  // jsdom 未实现 scrollIntoView：ActionLog 自动滚动 effect 会调用它
  Element.prototype.scrollIntoView = vi.fn();
  clearDeviationCache();
  vi.stubGlobal('requestIdleCallback', (fn: () => void) => { fn(); });
  const hand = makeHand();
  useHandHistoryStore.setState({ hands: [hand], currentHand: null, dbError: null });
  useHandHistoryStore.getState().setCurrentHand(hand);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HandReplayer 空态与头部', () => {
  it('无当前牌局时提示尚未加载', () => {
    useHandHistoryStore.setState({ currentHand: null });
    render(<HandReplayer />);

    expect(screen.getByText(i18n.t('handHistory.replay.noHandLoaded'))).not.toBeNull();
  });

  it('渲染牌局号 / 盲注 / 初始底池与控制按钮', async () => {
    render(<HandReplayer />);
    await flushAsync();

    expect(
      screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'P-1' })),
    ).not.toBeNull();
    expect(document.body.textContent).toContain('$1/$2');
    expect(document.body.textContent).toContain('$0.00');

    for (const label of ['prevStreet', 'prevAction', 'nextAction', 'nextStreet', 'play'] as const) {
      button(i18n.t(`handHistory.replay.${label}`));
    }
    // 座位与公共牌区域已挂载
    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.getByText('Bob')).not.toBeNull();
  });
});

describe('HandReplayer 回放控制', () => {
  it('下一步推进底池，上一步回退', async () => {
    render(<HandReplayer />);
    await flushAsync();

    fireEvent.click(button(i18n.t('handHistory.replay.nextAction')));
    expect(document.body.textContent).toContain('$6.00');

    fireEvent.click(button(i18n.t('handHistory.replay.nextAction')));
    expect(document.body.textContent).toContain('$12.00');

    fireEvent.click(button(i18n.t('handHistory.replay.prevAction')));
    expect(document.body.textContent).toContain('$6.00');
    expect(document.body.textContent).not.toContain('$12.00');
  });

  it('播放按钮切换为暂停态并可再切回', async () => {
    render(<HandReplayer />);
    await flushAsync();

    fireEvent.click(button(i18n.t('handHistory.replay.play')));
    expect(useHandHistoryStore.getState().replayState.isPlaying).toBe(true);
    button(i18n.t('handHistory.replay.pause'));

    fireEvent.click(button(i18n.t('handHistory.replay.pause')));
    expect(useHandHistoryStore.getState().replayState.isPlaying).toBe(false);
    button(i18n.t('handHistory.replay.play'));
  });

  it('倍速按钮写入播放速度并高亮当前档位', async () => {
    render(<HandReplayer />);
    await flushAsync();

    const speedButton = screen.getByText('4x');
    fireEvent.click(speedButton);
    expect(useHandHistoryStore.getState().replayState.playbackSpeed).toBe(4);
    expect(speedButton.className).toContain('bg-[var(--brass)]/15');
    expect(screen.getByText('1x').className).not.toContain('bg-[var(--brass)]/15');
  });

  it('街道跳转联动回放状态与批注面板标题', async () => {
    render(<HandReplayer />);
    await flushAsync();

    expect(
      screen.getByText(i18n.t('handHistory.annotation.notes', { street: 'preflop' })),
    ).not.toBeNull();

    const flopLabel = screen
      .getAllByText(i18n.t('handHistory.streets.flop'))
      .find((el) => el.closest('button'));
    expect(flopLabel).not.toBeUndefined();
    fireEvent.click(flopLabel!);
    expect(useHandHistoryStore.getState().replayState.currentStreet).toBe('flop');
    expect(
      screen.getByText(i18n.t('handHistory.annotation.notes', { street: 'flop' })),
    ).not.toBeNull();

    fireEvent.click(button(i18n.t('handHistory.replay.nextStreet')));
    expect(useHandHistoryStore.getState().replayState.currentStreet).toBe('turn');
  });
});

describe('HandReplayer hero 识别与 GTO 面板', () => {
  it('优先用 heroPlayerId 定位 hero，并渲染偏差面板', async () => {
    render(<HandReplayer />);
    await flushAsync();

    expect(screen.getByText(i18n.t('handHistory.deviation.title'))).not.toBeNull();
  });

  it('旧数据无 heroPlayerId 时回退到第一个有底牌的玩家', async () => {
    const hand = makeHand({ id: 'p2', heroPlayerId: undefined });
    useHandHistoryStore.setState({ hands: [hand] });
    useHandHistoryStore.getState().setCurrentHand(hand);

    render(<HandReplayer />);
    await flushAsync();

    expect(screen.getByText(i18n.t('handHistory.deviation.title'))).not.toBeNull();
  });

  it('无任何底牌信息时不渲染偏差面板', async () => {
    const hand = makeHand({
      id: 'p3',
      heroPlayerId: undefined,
      players: [
        { id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 },
        { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
      ],
    });
    useHandHistoryStore.setState({ hands: [hand] });
    useHandHistoryStore.getState().setCurrentHand(hand);

    render(<HandReplayer />);
    await flushAsync();

    expect(screen.queryByText(i18n.t('handHistory.deviation.title'))).toBeNull();
  });
});

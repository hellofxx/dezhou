import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from '../store';
import type { HandHistory } from '../types';
import { clearDeviationCache } from '../utils/gtoDeviation';
import HandReplayPage from './HandReplayPage';

/**
 * 回放路由页冒烟（jsdom）。
 * 覆盖：loading 态、库已加载但找不到牌局（notFound + 返回列表）、
 * 库已加载命中牌局直接渲染回放、未加载时经 loadFromDB 回填后再渲染。
 * 未覆盖（L4）：真实路由懒加载与浏览器返回栈。
 */

MotionGlobalConfig.skipAnimations = true;

function makeHand(): HandHistory {
  return {
    id: 'rp1',
    site: 'pokerstars',
    handNumber: 'RP-1',
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
        holeCards: [
          { rank: Rank.Ace, suit: Suit.Hearts },
          { rank: Rank.King, suit: Suit.Hearts },
        ],
      },
      { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Fold, playerIndex: 1 },
      ],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 6,
    heroPlayerId: 0,
    annotations: {},
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

async function flushAsync(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mount(handId = 'rp1') {
  return render(
    <MemoryRouter initialEntries={[`/hand-history/${handId}`]}>
      <Routes>
        <Route path="/hand-history/:handId" element={<HandReplayPage />} />
        <Route path="/hand-history" element={<div data-testid="list-page" />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  Element.prototype.scrollIntoView = vi.fn();
  clearDeviationCache();
  vi.stubGlobal('requestIdleCallback', (fn: () => void) => { fn(); });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('HandReplayPage', () => {
  it('库未加载完成时展示 loading 文案', () => {
    useHandHistoryStore.setState({
      hands: [],
      currentHand: null,
      loaded: false,
      dbError: null,
      loadFromDB: vi.fn(() => new Promise<void>(() => {})),
    });
    mount();

    expect(screen.getByText(i18n.t('handHistory.replayPage.loading'))).not.toBeNull();
  });

  it('加载完成后找不到对应牌局：提示未找到并可返回列表', () => {
    useHandHistoryStore.setState({
      hands: [],
      currentHand: null,
      loaded: true,
      dbError: null,
      loadFromDB: vi.fn(async () => {}),
    });
    mount('missing');

    expect(screen.getByText(i18n.t('handHistory.replayPage.notFound'))).not.toBeNull();
    fireEvent.click(screen.getByText(i18n.t('handHistory.replayPage.backToList')));
    expect(screen.getByTestId('loc').textContent).toBe('/hand-history');
  });

  it('库已加载且命中牌局时直接渲染回放视图', async () => {
    const hand = makeHand();
    useHandHistoryStore.setState({
      hands: [hand],
      currentHand: null,
      loaded: true,
      dbError: null,
      loadFromDB: vi.fn(async () => {}),
    });
    mount();

    expect(
      screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'RP-1' })),
    ).not.toBeNull();
    expect(useHandHistoryStore.getState().currentHand?.id).toBe('rp1');
    // 偏差面板的分析在微任务中完成，测试体内冲刷，避免 act 警告
    await flushAsync();
  });

  it('未加载时经 loadFromDB 回填后定位牌局', async () => {
    const hand = makeHand();
    const loadFromDB = vi.fn(async () => {
      useHandHistoryStore.setState({ hands: [hand], loaded: true });
    });
    useHandHistoryStore.setState({
      hands: [],
      currentHand: null,
      loaded: false,
      dbError: null,
      loadFromDB,
    });

    mount();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(loadFromDB).toHaveBeenCalledTimes(1);
    expect(useHandHistoryStore.getState().currentHand?.id).toBe('rp1');
    expect(
      screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'RP-1' })),
    ).not.toBeNull();
    await flushAsync();
  });
});

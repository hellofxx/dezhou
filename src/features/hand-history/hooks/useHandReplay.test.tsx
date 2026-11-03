import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from '../store';
import type { HandHistory } from '../types';
import { useHandReplay } from './useHandReplay';

/**
 * 回放引擎 hook 测试（jsdom + fake timers）。
 * 覆盖：自动播放计时器推进、倍速影响间隔、卸载清理、摊牌自动暂停、
 * 上/下一街跳转、当前行动玩家、弃牌集合（含摊牌态需包含全部街道弃牌的回归锁）。
 */

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(): HandHistory {
  return {
    id: 'r1',
    site: 'pokerstars',
    handNumber: 'R1',
    timestamp: 1_700_000_000_000,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      { id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 },
      { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Fold, playerIndex: 1 },
      ],
      flop: {
        cards: [c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.Two, Suit.Clubs)],
        actions: [{ type: ActionType.Check, playerIndex: 0 }],
      },
      turn: { cards: [c(Rank.Seven, Suit.Diamonds)], actions: [{ type: ActionType.Check, playerIndex: 0 }] },
      river: { cards: [c(Rank.Nine, Suit.Hearts)], actions: [{ type: ActionType.Check, playerIndex: 0 }] },
    },
    pot: 6,
    annotations: {},
  };
}

function Probe() {
  const replay = useHandReplay();
  return (
    <div>
      <span data-testid="street">{replay.state.currentStreet}</span>
      <span data-testid="idx">{replay.state.currentActionIndex}</span>
      <span data-testid="playing">{String(replay.state.isPlaying)}</span>
      <span data-testid="active">{replay.activePlayerIndex}</span>
      <span data-testid="folded">{[...replay.foldedPlayers].toSorted().join(',')}</span>
      <button data-testid="toggle" onClick={replay.togglePlay} />
      <button data-testid="next" onClick={replay.nextAction} />
      <button data-testid="prev" onClick={replay.prevAction} />
      <button data-testid="next-street" onClick={replay.skipToNextStreet} />
      <button data-testid="prev-street" onClick={replay.skipToPrevStreet} />
      <button data-testid="showdown" onClick={() => replay.jumpToStreet('showdown')} />
      <button data-testid="fast" onClick={() => replay.setPlaybackSpeed(2)} />
    </div>
  );
}

function read(testId: string): string {
  return screen.getByTestId(testId).textContent ?? '';
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  useHandHistoryStore.setState({ hands: [makeHand()], currentHand: null, dbError: null });
  useHandHistoryStore.getState().setCurrentHand(makeHand());
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useHandReplay 自动播放', () => {
  it('播放后按 1s 间隔逐步推进，走完本街后进入下一街', async () => {
    render(<Probe />);
    expect(read('playing')).toBe('false');

    fireEvent.click(screen.getByTestId('toggle'));
    expect(read('playing')).toBe('true');

    await advance(1000);
    expect(read('idx')).toBe('1');
    await advance(1000);
    expect(read('idx')).toBe('2');
    // 本街动作已走完（2 个）→ 下一次 tick 进入翻牌
    await advance(1000);
    expect(read('street')).toBe('flop');
    expect(read('idx')).toBe('0');

    fireEvent.click(screen.getByTestId('toggle'));
    expect(read('playing')).toBe('false');
  });

  it('倍速 2x 时 500ms 推进一次', async () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('fast'));
    fireEvent.click(screen.getByTestId('toggle'));

    await advance(500);
    expect(read('idx')).toBe('1');
  });

  it('摊牌街道自动暂停播放', async () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('toggle'));
    expect(read('playing')).toBe('true');

    act(() => {
      const state = useHandHistoryStore.getState();
      useHandHistoryStore.setState({
        replayState: { ...state.replayState, currentStreet: 'showdown', isPlaying: true },
      });
    });

    expect(read('playing')).toBe('false');
  });

  it('卸载时清理计时器，不再推进回放状态', async () => {
    const view = render(<Probe />);
    fireEvent.click(screen.getByTestId('toggle'));
    view.unmount();

    await advance(3000);
    expect(useHandHistoryStore.getState().replayState.currentActionIndex).toBe(0);
  });
});

describe('useHandReplay 街道跳转', () => {
  it('下一街 / 上一街在边界处不越界', async () => {
    render(<Probe />);

    fireEvent.click(screen.getByTestId('prev-street'));
    expect(read('street')).toBe('preflop');

    fireEvent.click(screen.getByTestId('next-street'));
    expect(read('street')).toBe('flop');

    fireEvent.click(screen.getByTestId('showdown'));
    expect(read('street')).toBe('showdown');
    // 已是最后一街，继续「下一街」保持不动
    fireEvent.click(screen.getByTestId('next-street'));
    expect(read('street')).toBe('showdown');
    expect(read('playing')).toBe('false');
  });

  it('上一街按钮定位到该街起始动作；上一步按钮回退到上一街末动作', async () => {
    render(<Probe />);
    fireEvent.click(screen.getByTestId('next-street'));
    expect(read('street')).toBe('flop');

    // prevAction：翻牌 0 处回退 → 上一街（翻前）最后一个动作
    fireEvent.click(screen.getByTestId('prev'));
    expect(read('street')).toBe('preflop');
    expect(read('idx')).toBe('2');

    // 上一街按钮（jumpToStreet）：位置回到该街起点
    fireEvent.click(screen.getByTestId('next-street'));
    fireEvent.click(screen.getByTestId('prev-street'));
    expect(read('street')).toBe('preflop');
    expect(read('idx')).toBe('0');
  });
});

describe('useHandReplay 派生状态', () => {
  it('当前行动玩家来自上一条动作，未开始 / 摊牌时为 -1', () => {
    render(<Probe />);
    expect(read('active')).toBe('-1');

    fireEvent.click(screen.getByTestId('next'));
    expect(read('active')).toBe('0');

    fireEvent.click(screen.getByTestId('next'));
    expect(read('active')).toBe('1');

    fireEvent.click(screen.getByTestId('showdown'));
    expect(read('active')).toBe('-1');
  });

  it('弃牌集合按已执行动作累计，摊牌态包含全部街道的弃牌', () => {
    render(<Probe />);
    expect(read('folded')).toBe('');

    fireEvent.click(screen.getByTestId('next'));
    expect(read('folded')).toBe('');

    fireEvent.click(screen.getByTestId('next'));
    expect(read('folded')).toBe('1');

    // 摊牌态（修复前 streetKeys.indexOf('showdown') 为 -1，导致弃牌标记全部丢失）
    fireEvent.click(screen.getByTestId('showdown'));
    expect(read('folded')).toBe('1');
  });
});

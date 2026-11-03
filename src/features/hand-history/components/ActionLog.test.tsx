import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import { ActionLog } from './ActionLog';

/**
 * 行动流水冒烟（jsdom）。
 * 覆盖：四条街标签与空街占位、HH-020 增量展示（Call 减去先前投入 / Raise 显示 to）、
 * 当前动作高亮标记（data-active，供自动滚动定位）、点击跳转到指定动作、
 * 摊牌态不产生任何高亮（无 currentStreet 匹配）。
 */

function c(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function makeHand(): HandHistory {
  return {
    id: 'a1',
    site: 'pokerstars',
    handNumber: 'A1',
    timestamp: 1_700_000_000_000,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      { id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 },
      { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      // to 金额口径：Alice raise to 6，Bob 跟注补到 6
      preflop: [
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Call, amount: 6, playerIndex: 1 },
      ],
      flop: {
        cards: [c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.Two, Suit.Clubs)],
        actions: [
          { type: ActionType.Check, playerIndex: 0 },
          { type: ActionType.Raise, amount: 4, playerIndex: 1 },
          { type: ActionType.Call, amount: 4, playerIndex: 0 },
        ],
      },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 20,
    annotations: {},
  };
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  // jsdom 未实现 scrollIntoView：ActionLog 的自动滚动 effect 会调用它
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ActionLog 渲染', () => {
  it('四条街标签齐备，空街显示「无动作」', () => {
    render(<ActionLog hand={makeHand()} currentStreet="preflop" currentActionIndex={0} />);

    for (const street of ['preflop', 'flop', 'turn', 'river'] as const) {
      expect(screen.getByText(i18n.t(`handHistory.streets.${street}`))).not.toBeNull();
    }
    expect(screen.getAllByText(i18n.t('handHistory.streets.noActions'))).toHaveLength(2);
  });

  it('HH-020：Call 显示增量、Raise 显示 to 总额', () => {
    render(<ActionLog hand={makeHand()} currentStreet="preflop" currentActionIndex={0} />);

    const text = document.body.textContent ?? '';
    expect(text).toContain('Alice: raises to $6');
    // 无先前投入时 Call 增量即 to 值
    expect(text).toContain('Bob: calls $6');
    expect(text).toContain('Alice: checks');
    expect(text).toContain('Bob: raises to $4');
    expect(text).toContain('Alice: calls $4');
  });

  it('当前动作唯一高亮（data-active），其余动作无该标记', () => {
    render(<ActionLog hand={makeHand()} currentStreet="flop" currentActionIndex={2} />);

    const active = document.querySelectorAll('[data-active="true"]');
    expect(active).toHaveLength(1);
    expect(active[0]!.textContent).toBe('Bob: raises to $4');
  });

  it('摊牌态不产生高亮（无匹配街道）', () => {
    render(<ActionLog hand={makeHand()} currentStreet="showdown" currentActionIndex={0} />);
    expect(document.querySelectorAll('[data-active="true"]')).toHaveLength(0);
  });
});

describe('ActionLog 交互', () => {
  it('点击动作行按「该动作序号」回调 jumpToAction', () => {
    const onJump = vi.fn();
    render(
      <ActionLog
        hand={makeHand()}
        currentStreet="flop"
        currentActionIndex={1}
        onJumpToAction={onJump}
      />,
    );

    fireEvent.click(screen.getByText('Alice: calls $4'));
    expect(onJump).toHaveBeenCalledWith('flop', 3);

    fireEvent.click(screen.getByText('Alice: raises to $6'));
    expect(onJump).toHaveBeenLastCalledWith('preflop', 1);
  });

  it('未提供回调时点击不抛错', () => {
    render(<ActionLog hand={makeHand()} currentStreet="preflop" currentActionIndex={1} />);
    expect(() => fireEvent.click(screen.getByText('Bob: calls $6'))).not.toThrow();
  });
});

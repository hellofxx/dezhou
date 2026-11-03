import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';
import { StreetTimeline } from './StreetTimeline';

/**
 * 街道时间线冒烟（jsdom）。
 * 覆盖：五个街道按钮、动作数徽标（空街不显示）、点击跳转回调、
 * 当前街 / 已完成街的样式状态（视觉数值本身由 L4 与 designTokenGuard 守护）。
 */

MotionGlobalConfig.skipAnimations = true;

function hand(): HandHistory {
  return {
    id: 't1',
    site: 'pokerstars',
    handNumber: 'T1',
    timestamp: 1_700_000_000_000,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [{ id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 }],
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Call, amount: 6, playerIndex: 0 },
      ],
      flop: {
        cards: [
          { rank: Rank.Ace, suit: Suit.Spades },
          { rank: Rank.King, suit: Suit.Hearts },
          { rank: Rank.Two, suit: Suit.Clubs },
        ],
        actions: [
          { type: ActionType.Check, playerIndex: 0 },
          { type: ActionType.Check, playerIndex: 0 },
          { type: ActionType.Check, playerIndex: 0 },
        ],
      },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 12,
    annotations: {},
  };
}

function streetButton(street: string): HTMLButtonElement {
  return screen.getByText(i18n.t(`handHistory.streets.${street}`)).closest('button') as HTMLButtonElement;
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  cleanup();
});

describe('StreetTimeline', () => {
  it('渲染五个街道按钮，仅为有动作的街道显示动作数', () => {
    render(<StreetTimeline hand={hand()} currentStreet="preflop" onJump={() => {}} />);

    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText(i18n.t('handHistory.streets.actions', { count: 2 }))).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.streets.actions', { count: 3 }))).not.toBeNull();
    // turn / river 无动作 → 不渲染 "0 个动作"
    expect(screen.queryByText(i18n.t('handHistory.streets.actions', { count: 0 }))).toBeNull();
  });

  it('点击任意街道回调该街道 key（含摊牌）', () => {
    const onJump = vi.fn();
    render(<StreetTimeline hand={hand()} currentStreet="preflop" onJump={onJump} />);

    fireEvent.click(streetButton('turn'));
    expect(onJump).toHaveBeenLastCalledWith('turn');

    fireEvent.click(streetButton('showdown'));
    expect(onJump).toHaveBeenLastCalledWith('showdown');
  });

  it('当前街高亮，之前的街道标记为已完成，之后的街道为未到达态', () => {
    render(<StreetTimeline hand={hand()} currentStreet="turn" onJump={() => {}} />);

    expect(streetButton('preflop').className).toContain('border-[var(--sage)]/30');
    expect(streetButton('flop').className).toContain('border-[var(--sage)]/30');
    expect(streetButton('turn').className).toContain('border-[var(--brass)]/40');
    expect(streetButton('river').className).toContain('text-[var(--ivory-muted)]');
    expect(streetButton('showdown').className).toContain('text-[var(--ivory-muted)]');
  });
});

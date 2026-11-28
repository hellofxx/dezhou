import { describe, expect, it } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import { Rank, Suit } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';
import type { PreviousAction, Street } from '../types';
import { seededRandom } from '@/shared/utils/seededShuffle';
import { computePreflopPot, generateDecisionNodes } from './decisionNodes';

const HERO: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.King },
];

function roundBB(value: number): number {
  return Math.round(value * 10) / 10;
}

function potBeforeStreet(history: PreviousAction[], street: Street): number {
  const order: Street[] = ['preflop', 'flop', 'turn', 'river'];
  const completed = order.slice(1, order.indexOf(street));
  let pot = computePreflopPot(history);
  for (const completedStreet of completed) {
    const positions = new Set(
      history.filter((action) => action.street === completedStreet).map((action) => action.position)
    );
    for (const position of positions) {
      const amounts = history
        .filter((action) => action.street === completedStreet
          && action.position === position
          && (action.action === ActionType.Raise || action.action === ActionType.Call || action.action === ActionType.AllIn))
        .map((action) => action.amount ?? 0);
      pot += Math.max(0, ...amounts);
    }
  }
  return roundBB(pot);
}

describe('computePreflopPot', () => {
  it('仅 blinds 时为 1.5BB，open 不重复计算 BB', () => {
    expect(computePreflopPot([])).toBe(1.5);
    expect(computePreflopPot([
      { position: Position.BTN, action: ActionType.Raise, amount: 2.5 },
    ])).toBe(4);
  });

  it('BB call 到 2.5BB 时贡献为 2.5，而不是 blind 再加 2.5', () => {
    expect(computePreflopPot([
      { position: Position.BTN, action: ActionType.Raise, amount: 2.5 },
      { position: Position.BB, action: ActionType.Call, amount: 2.5 },
    ])).toBe(5.5);
  });

  it('同一位置多次到注取 max，并计入 All-In', () => {
    expect(computePreflopPot([
      { position: Position.CO, action: ActionType.Raise, amount: 2.5 },
      { position: Position.BTN, action: ActionType.Raise, amount: 9 },
      { position: Position.CO, action: ActionType.AllIn, amount: 9 },
      { position: Position.BB, action: ActionType.Fold },
    ])).toBe(19.5);
  });
});

describe('generateDecisionNodes 金额历史', () => {
  it('BB 翻后起始底池复用翻前贡献额：BTN open + BB call = 5.5BB', () => {
    const nodes = generateDecisionNodes('flop', HERO, Position.BB, 'standard', 100, 'advanced', 6, seededRandom(7));
    expect(nodes[0]!.potSize).toBe(5.5);
  });

  it('BTN open + SB call 不重复计 SB blind，起始底池为 6BB', () => {
    const nodes = generateDecisionNodes('flop', HERO, Position.BTN, 'standard', 100, 'advanced', 6, seededRandom(7));
    expect(nodes[0]!.potSize).toBe(6);
  });

  it('非盲注位 open/call 起始底池为 6.5BB', () => {
    const nodes = generateDecisionNodes('flop', HERO, Position.UTG, 'standard', 100, 'advanced', 6, seededRandom(7));
    expect(nodes[0]!.potSize).toBe(6.5);
  });

  it.each([5, 20])('短筹码 %sBB 时各节点 pot 等于已完成街的历史贡献', (effectiveStack) => {
    const nodes = generateDecisionNodes('flop', HERO, Position.BTN, 'standard', effectiveStack, 'advanced', 6, seededRandom(11));
    for (const node of nodes) {
      expect(node.potSize).toBe(potBeforeStreet(node.previousActions, node.street));
    }
  });
});

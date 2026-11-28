import { describe, expect, it } from 'vitest';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import type { DecisionNode, Scenario } from '../types';
import { getDecisionCalibration } from './calibration';

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'test',
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    gameVariant: 'standard',
    street: 'preflop',
    potSize: 1.5,
    previousActions: [],
    heroHand: [
      { suit: Suit.Spades, rank: Rank.Ace },
      { suit: Suit.Hearts, rank: Rank.Ace },
    ],
    difficulty: 'intermediate',
    ...overrides,
  };
}

function flopNode(): DecisionNode {
  return {
    id: 'n1',
    street: 'flop',
    description: 'flop',
    board: {
      flop: [
        { suit: Suit.Spades, rank: Rank.King },
        { suit: Suit.Hearts, rank: Rank.Seven },
        { suit: Suit.Clubs, rank: Rank.Two },
      ],
      turn: null,
      river: null,
    },
    potSize: 6,
    heroHand: [
      { suit: Suit.Spades, rank: Rank.Ace },
      { suit: Suit.Hearts, rank: Rank.Ace },
    ],
    gtoStrategy: { fold: 0, call: 0, raise: 1 },
    previousActions: [{ position: Position.BTN, action: ActionType.Call, amount: 2.5 }],
  };
}

describe('getDecisionCalibration', () => {
  it('标准 6-max/100BB 翻前表 spot 标记为 calibrated', () => {
    expect(getDecisionCalibration(scenario())).toBe('calibrated');
  });

  it('非 6-max、非 100BB、短牌与翻后均标记为 heuristic', () => {
    expect(getDecisionCalibration(scenario({ playerCount: 9 }))).toBe('heuristic');
    expect(getDecisionCalibration(scenario({ effectiveStack: 50 }))).toBe('heuristic');
    expect(getDecisionCalibration(scenario({ gameVariant: 'short-deck' }))).toBe('heuristic');
    expect(getDecisionCalibration(scenario({ street: 'flop' }), flopNode())).toBe('heuristic');
  });

  it('标准翻前但 spot 未覆盖时标记为 unavailable', () => {
    expect(getDecisionCalibration(scenario({ position: Position.BB }))).toBe('unavailable');
  });

  it('Exploit 调整策略参与判分时不再标记 calibrated', () => {
    expect(getDecisionCalibration(scenario(), undefined, true)).toBe('heuristic');
  });
});
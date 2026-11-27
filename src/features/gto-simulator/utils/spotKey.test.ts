import { describe, expect, it } from 'vitest';
import { Position } from '@/shared/types/position';
import { Rank, Suit } from '@/shared/types/poker';
import { getPreflopHandStrategy, getStrategiesForSpot } from './spotKey';

describe('preflop 策略表补齐', () => {
  it('已覆盖 spot 补齐 169 手，未列出的手牌为纯 fold', () => {
    const table = getStrategiesForSpot('utg_open');
    expect(table).not.toBeNull();
    expect(Object.keys(table!)).toHaveLength(169);
    expect(table!['72o']).toEqual({ fold: 1, call: 0, raise: 0 });
  });

  it('已覆盖 spot 中未列出的具体手牌返回纯 fold，而不是 null', () => {
    const strategy = getPreflopHandStrategy(
      Position.UTG,
      [],
      [
        { suit: Suit.Clubs, rank: Rank.Seven },
        { suit: Suit.Diamonds, rank: Rank.Two },
      ]
    );
    expect(strategy).toEqual({ fold: 1, call: 0, raise: 0 });
  });

  it('未覆盖 spot 仍返回 null', () => {
    expect(getStrategiesForSpot(null)).toBeNull();
    expect(getPreflopHandStrategy(Position.BB, [], [
      { suit: Suit.Clubs, rank: Rank.Seven },
      { suit: Suit.Diamonds, rank: Rank.Two },
    ])).toBeNull();
  });
});
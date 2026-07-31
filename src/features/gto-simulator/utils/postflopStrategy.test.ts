import { describe, it, expect } from 'vitest';
import { Suit, Rank } from '@/shared/types/poker';
import type { Card, Board } from '@/shared/types/poker';
import { classifyHandStrength, estimatePostflopStrategy } from './postflopStrategy';

function makeBoard(flop: [Card, Card, Card]): Board {
  return { flop, turn: null, river: null };
}

describe('classifyHandStrength（P1C-04/23）', () => {
  it('顶对 → strong_hand', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Ace },
      { suit: Suit.Diamonds, rank: Rank.King },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.Ace },
      { suit: Suit.Spades, rank: 7 as Rank },
      { suit: Suit.Hearts, rank: 3 as Rank },
    ]);
    expect(classifyHandStrength(hero, board)).toBe('strong_hand');
  });

  it('底对 → weak_hand', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: 3 as Rank },
      { suit: Suit.Diamonds, rank: 5 as Rank },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.King },
      { suit: Suit.Spades, rank: Rank.Queen },
      { suit: Suit.Hearts, rank: 3 as Rank },
    ]);
    expect(classifyHandStrength(hero, board)).toBe('weak_hand');
  });

  it('口袋对低于顶张 → weak_hand', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: 6 as Rank },
      { suit: Suit.Diamonds, rank: 6 as Rank },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.King },
      { suit: Suit.Spades, rank: 9 as Rank },
      { suit: Suit.Hearts, rank: 2 as Rank },
    ]);
    expect(classifyHandStrength(hero, board)).toBe('weak_hand');
  });

  it('无对无听牌 → air', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: 2 as Rank },
      { suit: Suit.Diamonds, rank: 4 as Rank },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.King },
      { suit: Suit.Spades, rank: Rank.Queen },
      { suit: Suit.Hearts, rank: 9 as Rank },
    ]);
    expect(classifyHandStrength(hero, board)).toBe('air');
  });
});

describe('estimatePostflopStrategy 翻后策略随牌力变化（P1C-04）', () => {
  it('strong_hand 策略 raise 频率较高', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Ace },
      { suit: Suit.Diamonds, rank: Rank.Ace },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.Ace },
      { suit: Suit.Spades, rank: 7 as Rank },
      { suit: Suit.Hearts, rank: 3 as Rank },
    ]);
    const strat = estimatePostflopStrategy(hero, board, 'dry', 'flop');
    expect(strat.raise).toBeGreaterThan(0.3);
  });

  it('air 策略 fold 频率高于 raise 频率', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: 2 as Rank },
      { suit: Suit.Diamonds, rank: 4 as Rank },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.King },
      { suit: Suit.Spades, rank: Rank.Queen },
      { suit: Suit.Hearts, rank: 9 as Rank },
    ]);
    const strat = estimatePostflopStrategy(hero, board, 'dry', 'flop');
    expect(strat.fold).toBeGreaterThan(strat.raise);
  });

  it('不同牌力返回不同策略', () => {
    const heroStrong: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Ace },
      { suit: Suit.Diamonds, rank: Rank.Ace },
    ];
    const heroWeak: [Card, Card] = [
      { suit: Suit.Hearts, rank: 2 as Rank },
      { suit: Suit.Diamonds, rank: 4 as Rank },
    ];
    const board = makeBoard([
      { suit: Suit.Clubs, rank: Rank.Ace },
      { suit: Suit.Spades, rank: 7 as Rank },
      { suit: Suit.Hearts, rank: 3 as Rank },
    ]);
    const s1 = estimatePostflopStrategy(heroStrong, board, 'dry', 'flop');
    const s2 = estimatePostflopStrategy(heroWeak, board, 'dry', 'flop');
    expect(s1.raise).not.toBe(s2.raise);
  });
});

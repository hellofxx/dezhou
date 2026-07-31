import { describe, it, expect } from 'vitest';
import { Suit, Rank } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';
import { drawCards, generateFlop, generateTurnCard, generateRiverCard } from './boardGenerator';

describe('boardGenerator 发牌唯一性（P1C-01/26）', () => {
  it('drawCards 不重复', () => {
    for (let trial = 0; trial < 50; trial++) {
      const cards = drawCards(7);
      const keys = cards.map((c) => `${c.suit}-${c.rank}`);
      expect(new Set(keys).size).toBe(7);
    }
  });

  it('generateFlop 排除 hero 手牌', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Ace },
      { suit: Suit.Spades, rank: Rank.King },
    ];
    for (let i = 0; i < 50; i++) {
      const { cards } = generateFlop('standard', hero);
      for (const c of cards) {
        const match = hero.some((h) => h.suit === c.suit && h.rank === c.rank);
        expect(match).toBe(false);
      }
    }
  });

  it('generateTurnCard 排除已有公共牌 + hero', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Diamonds, rank: 10 as Rank },
      { suit: Suit.Clubs, rank: 9 as Rank },
    ];
    for (let i = 0; i < 50; i++) {
      const { cards: flop } = generateFlop('standard', hero);
      const turn = generateTurnCard(flop, 'standard', hero);
      const all = [...hero, ...flop, turn];
      const keys = all.map((c) => `${c.suit}-${c.rank}`);
      expect(new Set(keys).size).toBe(all.length);
    }
  });

  it('generateRiverCard 排除全部已发牌 + hero → 7 张全局唯一', () => {
    const hero: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Queen },
      { suit: Suit.Spades, rank: Rank.Jack },
    ];
    for (let i = 0; i < 50; i++) {
      const { cards: flop } = generateFlop('standard', hero);
      const turn = generateTurnCard(flop, 'standard', hero);
      const river = generateRiverCard([...flop, turn], 'standard', hero);
      const all = [...hero, ...flop, turn, river];
      const keys = all.map((c) => `${c.suit}-${c.rank}`);
      expect(new Set(keys).size).toBe(7);
    }
  });
});

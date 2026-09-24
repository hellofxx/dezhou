import { describe, expect, it } from 'vitest';
import {
  createDeck,
  createShortDeck,
  shuffleDeck,
  dealCards,
  cardToString,
  stringToCard,
  getAllHandNotations,
} from './deck';
import { Suit, Rank } from '@/shared/types/poker';

describe('createDeck', () => {
  it('生成 52 张牌', () => {
    expect(createDeck()).toHaveLength(52);
  });

  it('52 张牌无重复', () => {
    const deck = createDeck();
    const keys = new Set(deck.map((c) => `${c.rank}-${c.suit}`));
    expect(keys.size).toBe(52);
  });

  it('包含所有花色和牌面组合', () => {
    const deck = createDeck();
    expect(deck.find((c) => c.rank === Rank.Ace && c.suit === Suit.Spades)).toBeDefined();
    expect(deck.find((c) => c.rank === Rank.Two && c.suit === Suit.Hearts)).toBeDefined();
  });
});

describe('createShortDeck', () => {
  it('短牌 36 张（移除 2-5）', () => {
    const deck = createShortDeck();
    expect(deck).toHaveLength(36);
    expect(deck.find((c) => c.rank === Rank.Two)).toBeUndefined();
    expect(deck.find((c) => c.rank === Rank.Five)).toBeUndefined();
  });
});

describe('shuffleDeck', () => {
  it('洗牌后牌数不变', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(52);
  });

  it('洗牌不修改原数组', () => {
    const deck = createDeck();
    const first = deck[0]!;
    shuffleDeck(deck);
    expect(deck[0]).toBe(first);
  });

  it('多次洗牌结果不同（概率极高）', () => {
    const deck = createDeck();
    const a = shuffleDeck(deck).map((c) => `${c.rank}${c.suit}`).join(',');
    const b = shuffleDeck(deck).map((c) => `${c.rank}${c.suit}`).join(',');
    // 52! 种排列，两次相同概率极低
    expect(a).not.toBe(b);
  });
});

describe('dealCards', () => {
  it('发 5 张 → 发出5张，剩余47张', () => {
    const [dealt, remaining] = dealCards(createDeck(), 5);
    expect(dealt).toHaveLength(5);
    expect(remaining).toHaveLength(47);
  });
});

describe('cardToString / stringToCard', () => {
  it('往返一致：Ah', () => {
    const card = { suit: Suit.Hearts, rank: Rank.Ace };
    expect(stringToCard(cardToString(card))).toEqual(card);
  });

  it('stringToCard 无效输入抛错', () => {
    expect(() => stringToCard('X')).toThrow();
  });
});

describe('getAllHandNotations', () => {
  it('返回 169 种规范手牌', () => {
    expect(getAllHandNotations()).toHaveLength(169);
  });

  it('包含 AA、AKs、AKo、32o', () => {
    const notations = getAllHandNotations();
    expect(notations).toContain('AA');
    expect(notations).toContain('AKs');
    expect(notations).toContain('AKo');
    expect(notations).toContain('32o');
  });
});

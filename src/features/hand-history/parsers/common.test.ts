import { describe, expect, it } from 'vitest';
import { parseCardString, parseBoardCards, detectFormat, parseAmount } from './common';
import { Suit, Rank } from '@/shared/types/poker';

describe('parseCardString', () => {
  it('解析 Ah → Hearts + Ace', () => {
    const card = parseCardString('Ah');
    expect(card.suit).toBe(Suit.Hearts);
    expect(card.rank).toBe(Rank.Ace);
  });

  it('解析 Tc → Clubs + Ten', () => {
    const card = parseCardString('Tc');
    expect(card.suit).toBe(Suit.Clubs);
    expect(card.rank).toBe(Rank.Ten);
  });

  it('解析 2d → Diamonds + Two', () => {
    expect(parseCardString('2d')).toEqual({ suit: Suit.Diamonds, rank: Rank.Two });
  });

  it('解析 Ks → Spades + King', () => {
    expect(parseCardString('Ks')).toEqual({ suit: Suit.Spades, rank: Rank.King });
  });

  it('大小写不敏感：aH → 同 Ah', () => {
    expect(parseCardString('aH')).toEqual(parseCardString('Ah'));
  });

  it('无效输入抛出错误', () => {
    expect(() => parseCardString('X')).toThrow();
    expect(() => parseCardString('Zz')).toThrow();
  });
});

describe('parseBoardCards', () => {
  it('解析空格分隔的多张牌', () => {
    const cards = parseBoardCards('Ah Kd Qs');
    expect(cards).toHaveLength(3);
    expect(cards[0]!.rank).toBe(Rank.Ace);
    expect(cards[2]!.suit).toBe(Suit.Spades);
  });
});

describe('detectFormat', () => {
  it('识别 PokerStars 格式', () => {
    expect(detectFormat('PokerStars Hand #123456')).toBe('pokerstars');
  });

  it('识别 GGPoker 格式', () => {
    expect(detectFormat('Hand #HD-789012')).toBe('ggpoker');
  });

  it('识别 partypoker 格式', () => {
    expect(detectFormat('Hand History for Game 123')).toBe('partypoker');
  });

  it('无法识别 → unknown', () => {
    expect(detectFormat('some random text')).toBe('unknown');
  });

  it('PokerStars fallback：HOLE CARDS 标记', () => {
    expect(detectFormat('*** HOLE CARDS ***')).toBe('pokerstars');
  });
});

describe('parseAmount', () => {
  it('解析 $1.50 → 1.5', () => {
    expect(parseAmount('$1.50')).toBeCloseTo(1.5, 10);
  });

  it('解析 1,500 → 1500', () => {
    expect(parseAmount('1,500')).toBe(1500);
  });

  it('无效字符串 → 0', () => {
    expect(parseAmount('abc')).toBe(0);
  });
});

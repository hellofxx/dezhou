/**
 * 牌型评估回归测试（标准德州内容纯化，2026-08-06）。
 *
 * 固化两条不变量：
 * 1. 标准德州（52 张）：葫芦 > 同花 > 顺子 > 三条；
 * 2. 短牌（主流 6+ 口径，PokerStars/Triton）：三条 > 顺子、同花 > 葫芦，
 *    且 A-6-7-8-9 为合法最小顺子。
 */
import { describe, it, expect } from 'vitest';
import { evaluateHand } from './handRanking';
import { Suit, Rank, HandRank } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';

const card = (suit: Suit, rank: Rank): Card => ({ suit, rank });

/** 三条 666（短牌合法牌面 6-A） */
const TRIPS: Card[] = [
  card(Suit.Spades, Rank.Six),
  card(Suit.Hearts, Rank.Six),
  card(Suit.Diamonds, Rank.Six),
  card(Suit.Clubs, Rank.Eight),
  card(Suit.Clubs, Rank.Nine),
];

/** 顺子 6-7-8-9-T */
const STRAIGHT: Card[] = [
  card(Suit.Clubs, Rank.Six),
  card(Suit.Diamonds, Rank.Seven),
  card(Suit.Spades, Rank.Eight),
  card(Suit.Hearts, Rank.Nine),
  card(Suit.Clubs, Rank.Ten),
];

/** 同花（5 张红心） */
const FLUSH: Card[] = [
  card(Suit.Hearts, Rank.Six),
  card(Suit.Hearts, Rank.Eight),
  card(Suit.Hearts, Rank.Nine),
  card(Suit.Hearts, Rank.Jack),
  card(Suit.Hearts, Rank.King),
];

/** 葫芦 999KK */
const FULL_HOUSE: Card[] = [
  card(Suit.Spades, Rank.Nine),
  card(Suit.Hearts, Rank.Nine),
  card(Suit.Diamonds, Rank.Nine),
  card(Suit.Clubs, Rank.King),
  card(Suit.Spades, Rank.King),
];

describe('标准德州牌型等级（52 张牌口径）', () => {
  it('葫芦 > 同花 > 顺子 > 三条', () => {
    const fh = evaluateHand(FULL_HOUSE, 'standard');
    const fl = evaluateHand(FLUSH, 'standard');
    const st = evaluateHand(STRAIGHT, 'standard');
    const tr = evaluateHand(TRIPS, 'standard');
    expect(fh.score).toBeGreaterThan(fl.score);
    expect(fl.score).toBeGreaterThan(st.score);
    expect(st.score).toBeGreaterThan(tr.score);
  });

  it('标准德州识别 A-2-3-4-5 为 wheel，且不识别 A-6-7-8-9', () => {
    const wheel: Card[] = [
      card(Suit.Spades, Rank.Ace),
      card(Suit.Hearts, Rank.Two),
      card(Suit.Diamonds, Rank.Three),
      card(Suit.Clubs, Rank.Four),
      card(Suit.Spades, Rank.Five),
    ];
    expect(evaluateHand(wheel, 'standard').rank).toBe(HandRank.Straight);
  });
});

describe('短牌牌型等级（主流 6+ 口径：三条 > 顺子，同花 > 葫芦）', () => {
  it('三条 > 顺子（与标准德州相反）', () => {
    const tr = evaluateHand(TRIPS, 'short-deck');
    const st = evaluateHand(STRAIGHT, 'short-deck');
    expect(tr.rank).toBe(HandRank.ThreeOfAKind);
    expect(st.rank).toBe(HandRank.Straight);
    expect(tr.score).toBeGreaterThan(st.score);
  });

  it('同花 > 葫芦（与标准德州相反）', () => {
    const fl = evaluateHand(FLUSH, 'short-deck');
    const fh = evaluateHand(FULL_HOUSE, 'short-deck');
    expect(fl.rank).toBe(HandRank.Flush);
    expect(fh.rank).toBe(HandRank.FullHouse);
    expect(fl.score).toBeGreaterThan(fh.score);
  });

  it('A-6-7-8-9 是短牌合法最小顺子，A-2-3-4-5 不合法', () => {
    const lowStraight: Card[] = [
      card(Suit.Spades, Rank.Ace),
      card(Suit.Hearts, Rank.Six),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.Eight),
      card(Suit.Spades, Rank.Nine),
    ];
    expect(evaluateHand(lowStraight, 'short-deck').rank).toBe(HandRank.Straight);

    const wheelWithRemoved: Card[] = [
      card(Suit.Spades, Rank.Ace),
      card(Suit.Hearts, Rank.Six),
      card(Suit.Diamonds, Rank.Seven),
      card(Suit.Clubs, Rank.King),
      card(Suit.Spades, Rank.Queen),
    ];
    expect(evaluateHand(wheelWithRemoved, 'short-deck').rank).toBe(HandRank.HighCard);
  });
});

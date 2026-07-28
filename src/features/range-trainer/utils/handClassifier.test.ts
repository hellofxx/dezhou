import { describe, expect, it } from 'vitest';
import { classifyHand, getHandCategory, isHandInRange } from './handClassifier';
import { Suit, Rank } from '@/shared/types/poker';

const card = (rank: Rank, suit: Suit) => ({ rank, suit });

describe('classifyHand', () => {
  it('对子：AsAh → AA', () => {
    expect(classifyHand(card(Rank.Ace, Suit.Spades), card(Rank.Ace, Suit.Hearts))).toBe('AA');
  });

  it('同花：AsKs → AKs', () => {
    expect(classifyHand(card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Spades))).toBe('AKs');
  });

  it('非同花：AsKh → AKo', () => {
    expect(classifyHand(card(Rank.Ace, Suit.Spades), card(Rank.King, Suit.Hearts))).toBe('AKo');
  });

  it('小牌在前：KhAs → AKo（自动排序高→低）', () => {
    expect(classifyHand(card(Rank.King, Suit.Spades), card(Rank.Ace, Suit.Hearts))).toBe('AKo');
  });

  it('中间对子：8h8d → 88', () => {
    expect(classifyHand(card(Rank.Eight, Suit.Hearts), card(Rank.Eight, Suit.Diamonds))).toBe('88');
  });
});

describe('getHandCategory', () => {
  it('AA → pair', () => {
    expect(getHandCategory('AA')).toBe('pair');
  });

  it('AKs → suited', () => {
    expect(getHandCategory('AKs')).toBe('suited');
  });

  it('JTo → offsuit', () => {
    expect(getHandCategory('JTo')).toBe('offsuit');
  });
});

describe('isHandInRange', () => {
  it('AKs 在 [AA, KK, AKs] 范围内 → true', () => {
    expect(isHandInRange('AKs', ['AA', 'KK', 'AKs'])).toBe(true);
  });

  it('QJs 不在 [AA, KK, AKs] 范围内 → false', () => {
    expect(isHandInRange('QJs', ['AA', 'KK', 'AKs'])).toBe(false);
  });

  it('空范围 → false', () => {
    expect(isHandInRange('AA', [])).toBe(false);
  });
});

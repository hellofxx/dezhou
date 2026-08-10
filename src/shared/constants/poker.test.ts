import { describe, expect, it } from 'vitest';
import { RANKS, RANK_DISPLAY, RANK_CARD_FACE_DISPLAY } from './poker';
import { Rank } from '@/shared/types/poker';

describe('RANK_DISPLAY（文字 notation / 理论表述）', () => {
  it('10 用 "T" 表示', () => {
    expect(RANK_DISPLAY[Rank.Ten]).toBe('T');
  });
});

describe('RANK_CARD_FACE_DISPLAY（扑克牌牌面实物渲染）', () => {
  it('10 渲染为 "10" 而非 "T"', () => {
    expect(RANK_CARD_FACE_DISPLAY[Rank.Ten]).toBe('10');
  });

  it('除 10 外与 RANK_DISPLAY 一致', () => {
    for (const rank of RANKS) {
      if (rank === Rank.Ten) continue;
      expect(RANK_CARD_FACE_DISPLAY[rank]).toBe(RANK_DISPLAY[rank]);
    }
  });

  it('覆盖全部牌面值', () => {
    for (const rank of RANKS) {
      expect(RANK_CARD_FACE_DISPLAY[rank]).toBeTruthy();
    }
  });
});

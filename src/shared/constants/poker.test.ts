import { describe, expect, it } from 'vitest';
import { RANKS, RANK_DISPLAY, RANK_CARD_FACE_DISPLAY, getPlayerCountOptions } from './poker';
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

describe('getPlayerCountOptions', () => {
  it('standard → [2,3,4,5,6,9]', () => {
    expect(getPlayerCountOptions('standard')).toEqual([2, 3, 4, 5, 6, 9]);
  });

  it('short-deck → [2,3,4,5,6]', () => {
    expect(getPlayerCountOptions('short-deck')).toEqual([2, 3, 4, 5, 6]);
  });

  it('heads-up → [2]', () => {
    expect(getPlayerCountOptions('heads-up')).toEqual([2]);
  });

  it('exclude 过滤指定人数（standard 排除 5）', () => {
    expect(getPlayerCountOptions('standard', [5])).toEqual([2, 3, 4, 6, 9]);
  });

  it('exclude 对非法人数无副作用', () => {
    expect(getPlayerCountOptions('heads-up', [5])).toEqual([2]);
  });
});

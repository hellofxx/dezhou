/**
 * RNG-004 回归：测验位置选项须按「人数契约 ∩ 存在预置范围」过滤。
 * 修复前 QuizConfig 用 SIX_MAX_POSITIONS 硬编码过滤，standard 2/3 人桌
 * 会显示桌位不存在的位置（UTG/HJ/CO/SB），与 RangeSelector 不一致。
 */
import { describe, it, expect } from 'vitest';
import { Position } from '@/shared/types/position';
import { getQuizPositionOptions } from './QuizConfig';
import {
  PRESET_RANGES,
  ADVANCED_PRESET_RANGES,
  FOUR_MAX_PRESET_RANGES,
  SHORT_DECK_PRESET_RANGES,
  HU_PRESET_RANGES,
} from '../constants';
import type { RangePreset } from '../types';

/** 六人桌预置（standard 默认 presets = PRESET + ADVANCED） */
const STANDARD_PRESETS: RangePreset[] = [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES];

describe('getQuizPositionOptions（RNG-004 人数契约过滤）', () => {
  it('standard 6 人桌：全部六位（与修复前 SIX_MAX 行为一致，无回归）', () => {
    const options = getQuizPositionOptions(6, STANDARD_PRESETS);
    expect(options).toEqual([Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB]);
  });

  it('standard 2 人桌：仅 BTN/BB（修复前错误显示全部六位）', () => {
    const options = getQuizPositionOptions(2, STANDARD_PRESETS);
    expect(options).toEqual([Position.BTN, Position.BB]);
  });

  it('standard 3 人桌：仅 BTN/SB/BB（修复前错误显示全部六位）', () => {
    const options = getQuizPositionOptions(3, STANDARD_PRESETS);
    expect(options).toEqual([Position.BTN, Position.SB, Position.BB]);
  });

  it('standard 4 人桌：4-Max 预置存在位置（CO/BTN/SB，与修复前一致）', () => {
    const options = getQuizPositionOptions(4, FOUR_MAX_PRESET_RANGES);
    expect(options).toContain(Position.CO);
    expect(options).toContain(Position.BTN);
    expect(options).toContain(Position.SB);
    expect(options).not.toContain(Position.UTG);
  });

  it('standard 9 人桌：预设覆盖的六位（UTG1/MP 无预置被过滤，与修复前一致）', () => {
    const options = getQuizPositionOptions(9, STANDARD_PRESETS);
    expect(options).toEqual([Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB]);
  });

  it('short-deck 2 人桌：仅 BTN（修复前错误显示 CO/BTN）', () => {
    const options = getQuizPositionOptions(2, SHORT_DECK_PRESET_RANGES);
    expect(options).toEqual([Position.BTN]);
  });

  it('heads-up：BTN/BB（与修复前一致）', () => {
    const options = getQuizPositionOptions(2, HU_PRESET_RANGES);
    expect(options).toEqual([Position.BTN, Position.BB]);
  });
});

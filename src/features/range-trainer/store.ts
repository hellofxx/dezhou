import { create } from 'zustand';
import type { HandNotation, GameVariant } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { RangePreset, LearnState, QuizSlice } from './types';
import { PRESET_RANGES, getPresetsForVariantAndPlayerCount } from './constants';
import { createQuizSlice } from './storeQuizSlice';

interface RangeTrainerCoreSlice {
  // 游戏变体配置
  gameVariant: GameVariant;
  playerCount: number;
  setGameVariant: (variant: GameVariant) => void;
  setPlayerCount: (count: number) => void;

  // 学习模式状态
  learnState: LearnState;

  // 学习 Actions
  setSelectedPreset: (preset: RangePreset | null) => void;
  setSelectedPosition: (position: Position) => void;
  setSelectedActionType: (actionType: string) => void;
  setHighlightedHand: (hand: HandNotation | null) => void;

  // 预设范围（随变体动态变化）
  presets: RangePreset[];
  getPresetsByPosition: (position: Position) => RangePreset[];
}

export type RangeTrainerStore = RangeTrainerCoreSlice & QuizSlice;

export const useRangeTrainerStore = create<RangeTrainerStore>((set, get, api) => ({
  // ─── 游戏变体配置 ────────────────────────────────────────
  gameVariant: 'standard',
  playerCount: 6,

  setGameVariant: (variant) => {
    const defaultPlayers = variant === 'heads-up' ? 2 : variant === 'short-deck' ? 6 : 6;
    set((state) => ({
      gameVariant: variant,
      playerCount: defaultPlayers,
      presets: getPresetsForVariantAndPlayerCount(variant, defaultPlayers),
      learnState: { ...state.learnState, selectedPreset: null },
    }));
  },

  setPlayerCount: (count) => {
    set((state) => ({
      playerCount: count,
      presets: getPresetsForVariantAndPlayerCount(state.gameVariant, count),
      learnState: { ...state.learnState, selectedPreset: null },
    }));
  },

  learnState: {
    selectedPreset: null,
    selectedPosition: Position.UTG,
    selectedActionType: 'open',
    highlightedHand: null,
  },

  setSelectedPreset: (preset) =>
    set((state) => ({
      learnState: { ...state.learnState, selectedPreset: preset },
    })),

  setSelectedPosition: (position) =>
    set((state) => ({
      learnState: {
        ...state.learnState,
        selectedPosition: position,
        selectedPreset: null,
      },
    })),

  setSelectedActionType: (actionType) =>
    set((state) => ({
      learnState: {
        ...state.learnState,
        selectedActionType: actionType,
        selectedPreset: null,
      },
    })),

  setHighlightedHand: (hand) =>
    set((state) => ({
      learnState: { ...state.learnState, highlightedHand: hand },
    })),

  presets: PRESET_RANGES,

  getPresetsByPosition: (position) => {
    return get().presets.filter((p) => p.position === position);
  },

  // ─── 测验模式（实现见 storeQuizSlice.ts）───────────────────
  ...createQuizSlice(set, get, api),
}));

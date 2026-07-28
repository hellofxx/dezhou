import { create } from 'zustand';
import type { OddsCalculatorState, EVCalculatorState } from './types';
import type { GameVariant } from '@/shared/types/poker';
import { DEFAULT_ODDS_STATE, DEFAULT_EV_STATE } from './constants';

interface PotOddsStore {
  oddsState: OddsCalculatorState;
  setPotSize: (size: number) => void;
  setBetSize: (size: number) => void;
  setOuts: (outs: number) => void;
  setStreet: (street: 'flop' | 'turn') => void;
  setImpliedOddsGain: (gain: number) => void;
  setGameVariant: (variant: GameVariant) => void;

  evState: EVCalculatorState;
  setWinRate: (rate: number) => void;
  setEVPotSize: (size: number) => void;
  setCallAmount: (amount: number) => void;

  resetOdds: () => void;
  resetEV: () => void;
}

export const usePotOddsStore = create<PotOddsStore>((set) => ({
  oddsState: { ...DEFAULT_ODDS_STATE },
  setPotSize: (size) => set((s) => ({ oddsState: { ...s.oddsState, potSize: size } })),
  setBetSize: (size) => set((s) => ({ oddsState: { ...s.oddsState, betSize: size } })),
  setOuts: (outs) => set((s) => ({ oddsState: { ...s.oddsState, outs } })),
  setStreet: (street) => set((s) => ({ oddsState: { ...s.oddsState, street } })),
  setImpliedOddsGain: (gain) => set((s) => ({ oddsState: { ...s.oddsState, impliedOddsGain: gain } })),
  setGameVariant: (variant) => set((s) => ({ oddsState: { ...s.oddsState, gameVariant: variant } })),

  evState: { ...DEFAULT_EV_STATE },
  setWinRate: (rate) => set((s) => ({ evState: { ...s.evState, winRate: rate } })),
  setEVPotSize: (size) => set((s) => ({ evState: { ...s.evState, potSize: size } })),
  setCallAmount: (amount) => set((s) => ({ evState: { ...s.evState, callAmount: amount } })),

  resetOdds: () => set({ oddsState: { ...DEFAULT_ODDS_STATE } }),
  resetEV: () => set({ evState: { ...DEFAULT_EV_STATE } }),
}));

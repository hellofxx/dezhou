import type { GameVariant } from '@/shared/types/poker';

export interface OddsCalculatorState {
  potSize: number;
  betSize: number;
  outs: number;
  street: 'flop' | 'turn';
  impliedOddsGain: number;
  gameVariant: GameVariant;
}

export interface EVCalculatorState {
  winRate: number;
  potSize: number;
  callAmount: number;
}

export interface OddsResult {
  potOdds: number;
  requiredEquity: number;
  estimatedEquity: number;
  isProfitable: boolean;
  ev: number;
}

export interface DrawInfo {
  name: string;
  outs: number;
  description: string;
}

// ─── Pot Odds Quiz 类型（供 PotOddsQuizPage 与 useOddsCalculation 共用） ───────

export type PotOddsQuizCategory =
  | 'odds-judgment'
  | 'outs-calculation'
  | 'implied-odds'
  | 'reverse-implied';

export interface PotOddsQuizOption {
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface PotOddsQuizQuestion {
  id: number;
  category: PotOddsQuizCategory;
  scenario: string;
  question: string;
  options: PotOddsQuizOption[];
}

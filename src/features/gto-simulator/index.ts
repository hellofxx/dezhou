// GTO Simulator Module - Public API
export type {
  Scenario,
  PreviousAction,
  GTOSpot,
  HandStrategy,
  GTOSession,
  GTODecision,
  ScenarioConfig,
  GTOResult,
  DecisionNode,
} from './types';

export type { BoardTexture } from './utils/boardGenerator';
export { classifyBoardTexture, generateFlop, generateTurnCard, generateRiverCard } from './utils/boardGenerator';
export { useGTOSimulatorStore } from './store';
export type { GTOFeedbackState } from './store';
export { useScenarioEngine } from './hooks/useScenarioEngine';
export { useGTOComparison } from './hooks/useGTOComparison';
export {
  compareDecision,
  calculateEVLoss,
  calculateEVFromAction,
  estimateHeroEquity,
  getOptimalAction,
} from './utils/strategyCompare';
export { ScenarioSetup } from './components/ScenarioSetup';
export { ActionSelector } from './components/ActionSelector';
export { StrategyMatrix } from './components/StrategyMatrix';
export { GTOFeedback } from './components/GTOFeedback';
export { DecisionTree } from './components/DecisionTree';
export { SpotTrainer } from './components/SpotTrainer';

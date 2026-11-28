import type { DecisionNode, Scenario, StrategyCalibration } from '../types';
import { resolveSpotKey } from './spotKey';

/**
 * 仅标准 6-max / 100BB 翻前表视为真实标定数据。
 * 其他人数、筹码、变体及全部翻后策略均为启发式，不得展示精确 EV / 五级评级。
 */
export function getDecisionCalibration(
  scenario: Scenario,
  node?: DecisionNode,
  exploitAdjusted: boolean = false
): StrategyCalibration {
  if (exploitAdjusted) return 'heuristic';
  const variant = scenario.gameVariant ?? 'standard';
  const street = node?.street ?? scenario.street;
  if (variant !== 'standard' || scenario.playerCount !== 6 || scenario.effectiveStack !== 100) {
    return 'heuristic';
  }
  if (street !== 'preflop') return 'heuristic';

  const spotKey = resolveSpotKey(
    scenario.position,
    node?.previousActions ?? scenario.previousActions
  );
  return spotKey ? 'calibrated' : 'unavailable';
}
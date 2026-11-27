import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { DecisionNode, LegalActionContext, Scenario } from '../types';

/** PreviousAction.amount 对 raise 表示 raise-to 总额；call 表示本街已投入总额。 */
export function computeCallAmount(
  scenario: Scenario,
  node: DecisionNode | undefined,
  _potSize: number
): number {
  const actions = node?.previousActions ?? scenario.previousActions;
  const street = node?.street ?? scenario.street;

  if (street === 'preflop') {
    const heroCommitment = actions
      .filter((a) => a.position === scenario.position && (a.action === 'raise' || a.action === 'call'))
      .at(-1)?.amount;
    const heroInvested = heroCommitment ?? (scenario.position === Position.BB ? 1 : scenario.position === Position.SB ? 0.5 : 0);
    const raises = actions.filter((a) => a.action === 'raise');
    const lastRaise = raises[raises.length - 1];
    const target = lastRaise?.amount ?? (scenario.position === Position.BB ? 0 : 1);
    return Math.round(Math.max(0, target - heroInvested) * 10) / 10;
  }

  const currentStreet = actions.filter((action) => action.street === street);
  const heroCommitment = currentStreet
    .filter((action) => action.position === scenario.position && (action.action === ActionType.Raise || action.action === ActionType.Call || action.action === ActionType.AllIn))
    .at(-1)?.amount ?? 0;
  const villainBet = currentStreet
    .filter((action) => action.position !== scenario.position && (action.action === ActionType.Raise || action.action === ActionType.AllIn))
    .at(-1);
  return Math.round(Math.max(0, (villainBet?.amount ?? 0) - heroCommitment) * 10) / 10;
}

function computeMinRaiseTo(
  scenario: Scenario,
  node: DecisionNode | undefined,
  callAmount: number
): number {
  const actions = node?.previousActions ?? scenario.previousActions;
  const street = node?.street ?? scenario.street;
  const raises = actions.filter((a) => a.action === 'raise');
  const lastRaise = raises.at(-1);

  if (street === 'preflop') {
    if (!lastRaise) return 2;
    // NLHE：最小加注增量 = 上一次加注增量。2.5BB open（BB 1 → 2.5）最小 3-bet 到 4.0BB。
    const previousRaiseTo = raises.at(-2)?.amount ?? 1;
    const increment = Math.max(1, (lastRaise.amount ?? 2.5) - previousRaiseTo);
    return Math.round(((lastRaise.amount ?? 2.5) + increment) * 10) / 10;
  }

  const currentRaises = actions.filter((action) => action.street === street && action.action === ActionType.Raise);
  const lastStreetRaise = currentRaises.at(-1);
  if (!lastStreetRaise) return Math.round(Math.max(callAmount * 2, 2) * 10) / 10;

  const betTo = lastStreetRaise.amount ?? callAmount;
  const previousTo = currentRaises.at(-2)?.amount ?? 0;
  const increment = Math.max(betTo - previousTo, callAmount, 1);
  return Math.round((betTo + increment) * 10) / 10;
}

export function getLegalActionContext(
  scenario: Scenario,
  node: DecisionNode | undefined,
  potSize: number
): LegalActionContext {
  const callAmount = computeCallAmount(scenario, node, potSize);
  const minRaiseTo = computeMinRaiseTo(scenario, node, callAmount);
  const maxRaiseTo = scenario.effectiveStack;
  return {
    callAmount,
    canCheck: callAmount === 0,
    minRaiseTo,
    maxRaiseTo,
    canRaise: minRaiseTo <= maxRaiseTo,
  };
}
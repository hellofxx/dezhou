import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { DecisionNode, LegalActionContext, Scenario } from '../types';
import { computeHeroInvestment } from './actionStory';

function isRaiseAction(action: ActionType): boolean {
  return action === ActionType.Raise || action === ActionType.AllIn;
}

/** PreviousAction.amount 对 raise/all-in 表示 raise-to 总额；call 表示本街已投入总额。 */
export function computeCallAmount(
  scenario: Scenario,
  node: DecisionNode | undefined
): number {
  const actions = node?.previousActions ?? scenario.previousActions;
  const street = node?.street ?? scenario.street;
  const heroInvested = computeHeroInvestment(actions, scenario.position, street);

  if (street === 'preflop') {
    const raises = actions.filter(
      (action) => (action.street === undefined || action.street === 'preflop') && isRaiseAction(action.action)
    );
    const lastRaise = raises.at(-1);
    const target = lastRaise?.amount ?? (scenario.position === Position.BB ? 0 : 1);
    return Math.round(Math.max(0, target - heroInvested) * 10) / 10;
  }

  const villainBet = actions
    .filter((action) => action.street === street && action.position !== scenario.position && isRaiseAction(action.action))
    .at(-1);
  return Math.round(Math.max(0, (villainBet?.amount ?? 0) - heroInvested) * 10) / 10;
}

function computeMinRaiseTo(
  scenario: Scenario,
  node: DecisionNode | undefined,
  callAmount: number
): number {
  const actions = node?.previousActions ?? scenario.previousActions;
  const street = node?.street ?? scenario.street;
  const raises = actions.filter(
    (action) => (action.street === undefined || action.street === 'preflop') && isRaiseAction(action.action)
  );
  const lastRaise = raises.at(-1);

  if (street === 'preflop') {
    if (!lastRaise) return 2;
    // NLHE：最小加注增量 = 上一次加注增量。2.5BB open（BB 1 → 2.5）最小 3-bet 到 4.0BB。
    const previousRaiseTo = raises.at(-2)?.amount ?? 1;
    const increment = Math.max(1, (lastRaise.amount ?? 2.5) - previousRaiseTo);
    return Math.round(((lastRaise.amount ?? 2.5) + increment) * 10) / 10;
  }

  const currentRaises = actions.filter((action) => action.street === street && isRaiseAction(action.action));
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
  const callAmount = computeCallAmount(scenario, node);
  const minRaiseTo = computeMinRaiseTo(scenario, node, callAmount);
  const maxRaiseTo = scenario.effectiveStack;
  return {
    callAmount,
    canCheck: callAmount === 0,
    minRaiseTo,
    maxRaiseTo,
    canRaise: potSize > 0 && minRaiseTo <= maxRaiseTo,
  };
}
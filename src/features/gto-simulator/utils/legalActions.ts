import { Position } from '@/shared/types/position';
import type { DecisionNode, LegalActionContext, Scenario } from '../types';
import { classifyBoardTexture } from './boardGenerator';
import { boardToFlat, getCbetSizingMultiplier } from './postflopStrategy';

/** PreviousAction.amount 对 raise 表示 raise-to 总额；call 表示本街已投入总额。 */
export function computeCallAmount(
  scenario: Scenario,
  node: DecisionNode | undefined,
  potSize: number
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

  const flat = node?.board ? boardToFlat(node.board) : scenario.board ? boardToFlat(scenario.board) : undefined;
  const texture = flat ? classifyBoardTexture(flat) : scenario.boardTexture;
  return Math.round(potSize * getCbetSizingMultiplier(texture) * 10) / 10;
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
    const previousRaiseTo = raises.at(-2)?.amount ?? 1;
    const increment = Math.max(1, (lastRaise.amount ?? 2.5) - previousRaiseTo);
    return Math.round(((lastRaise.amount ?? 2.5) + increment) * 10) / 10;
  }

  if (lastRaise) return Math.round(((lastRaise.amount ?? callAmount) + Math.max(callAmount, 1)) * 10) / 10;
  return Math.round(Math.max(callAmount * 2, 2) * 10) / 10;
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
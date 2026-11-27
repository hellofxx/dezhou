import { getOpponentProfile } from '@/shared/data/opponentProfiles';
import type { HandStrategy, Scenario } from '../types';

/** 根据对手类型调整 GTO 策略，生成剥削性策略。 */
export function adjustForOpponent(
  gtoStrategy: HandStrategy,
  opponentId: string,
  _scenario: Scenario
): HandStrategy {
  const opponent = getOpponentProfile(opponentId);
  if (!opponent || opponent.id === 'unknown') return gtoStrategy;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  if (opponent.id === 'nit') {
    const raise = clamp(gtoStrategy.raise + 0.15);
    const fold = clamp(gtoStrategy.fold - 0.10);
    const call = clamp(1 - raise - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  if (opponent.id === 'maniac') {
    const call = clamp(gtoStrategy.call + 0.15);
    const fold = clamp(gtoStrategy.fold - 0.10);
    const raise = clamp(1 - call - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  if (opponent.id === 'calling_station') {
    const fold = clamp(gtoStrategy.fold - 0.05);
    const raise = clamp(gtoStrategy.raise + 0.15);
    const call = clamp(1 - raise - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  if (opponent.id === 'lag') {
    const call = clamp(gtoStrategy.call + 0.08);
    const fold = clamp(gtoStrategy.fold - 0.05);
    const raise = clamp(1 - call - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  return gtoStrategy;
}
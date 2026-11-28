import { describe, expect, it } from 'vitest';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { appendCurrentStreetBet, computeHeroInvestment, tagStreet } from './actionStory';
import { getLegalActionContext } from './legalActions';
import { generateScenario } from './scenarioGenerator';
import type { PreviousAction } from '../types';

const PREFLOP = tagStreet([
  { position: Position.BTN, action: ActionType.Raise, amount: 2.5 },
  { position: Position.CO, action: ActionType.Call, amount: 2.5 },
], 'preflop');

describe('computeHeroInvestment', () => {
  it('翻前把盲注计入，并对同一位置的到注总额取 max', () => {
    const history = tagStreet([
      { position: Position.BTN, action: ActionType.Raise, amount: 2.5 },
      { position: Position.BB, action: ActionType.Raise, amount: 9 },
      { position: Position.BB, action: ActionType.Call, amount: 9 },
    ], 'preflop');
    expect(computeHeroInvestment(history, Position.BB, 'preflop')).toBe(9);
    expect(computeHeroInvestment(history, Position.SB, 'preflop')).toBe(0.5);
  });

  it('翻后只累计当前街，并识别 All-In 到注额', () => {
    const history: PreviousAction[] = [
      { position: Position.CO, action: ActionType.Call, amount: 2.5, street: 'preflop' },
      { position: Position.CO, action: ActionType.Call, amount: 2.1, street: 'flop' },
      { position: Position.CO, action: ActionType.AllIn, amount: 5, street: 'turn' },
    ];
    expect(computeHeroInvestment(history, Position.CO, 'flop')).toBe(2.1);
    expect(computeHeroInvestment(history, Position.CO, 'turn')).toBe(5);
  });
});

describe('appendCurrentStreetBet', () => {
  it('Hero 后位时由前位对手下注，不额外补 Check', () => {
    const history = appendCurrentStreetBet(PREFLOP, {
      street: 'flop',
      heroPosition: Position.BTN,
      playerCount: 6,
      potSize: 6.5,
      sizingMultiplier: 0.33,
      effectiveStack: 100,
    });
    expect(history.at(-1)).toMatchObject({
      position: Position.CO,
      action: ActionType.Raise,
      amount: 2.1,
      street: 'flop',
    });
    expect(history.some((action) => action.action === ActionType.Check)).toBe(false);
  });

  it('Hero 首位时先补 Check，再由对手下注', () => {
    const history = appendCurrentStreetBet(PREFLOP, {
      street: 'flop',
      heroPosition: Position.CO,
      playerCount: 6,
      potSize: 6.5,
      sizingMultiplier: 0.33,
      effectiveStack: 100,
    });
    expect(history.slice(-2)).toMatchObject([
      { position: Position.CO, action: ActionType.Check, street: 'flop' },
      { action: ActionType.Raise, street: 'flop' },
    ]);
  });
});

describe('生成场景的翻后动作与合法动作一致', () => {
  it.each(['flop', 'turn', 'river'] as const)('%s 场景记录本街下注，跟注额来自历史', (street) => {
    const config = {
      gameType: 'cash' as const,
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard' as const,
      difficulty: 'advanced' as const,
      scenarioCount: 1,
    };
    let scenario = generateScenario(config, 0, 7);
    for (let seed = 0; scenario.street !== street && seed < 200; seed++) {
      scenario = generateScenario(config, seed, seed + 1);
    }
    expect(scenario.street).toBe(street);

    const current = scenario.previousActions.filter((action) => action.street === street);
    const bet = current.filter((action) => action.action === ActionType.Raise).at(-1);
    expect(bet).toBeDefined();
    const context = getLegalActionContext(scenario, undefined, scenario.potSize);
    expect(context.callAmount).toBe(bet?.amount);
    expect(context.canCheck).toBe(false);
  });
});
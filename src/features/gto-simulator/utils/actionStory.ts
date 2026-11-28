import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PreviousAction, Street } from '../types';

export function tagStreet(actions: PreviousAction[], street: Street): PreviousAction[] {
  return actions.map((action) => ({ ...action, street: action.street ?? street }));
}

function isInvestmentAction(action: ActionType): boolean {
  return action === ActionType.Raise || action === ActionType.Call || action === ActionType.AllIn;
}

/**
 * 返回玩家在指定街的到注总额；翻前盲注也计入。
 * raise/call/all-in 的 amount 都是该街累计到注额，因此同一玩家取 max。
 */
export function computeHeroInvestment(
  actions: PreviousAction[],
  heroPosition: Position,
  street: Street
): number {
  let blind = 0;
  if (street === 'preflop' && heroPosition === Position.SB) blind = 0.5;
  if (street === 'preflop' && heroPosition === Position.BB) blind = 1;
  return actions.reduce((invested, action) => {
    const onStreet = street === 'preflop'
      ? action.street === undefined || action.street === 'preflop'
      : action.street === street;
    if (action.position !== heroPosition || !onStreet || !isInvestmentAction(action.action)) return invested;
    return Math.max(invested, action.amount ?? 0);
  }, blind);
}

/** 读取某街实际最后一笔下注/全下的到注额；历史缺失时返回 0。 */
export function getLastStreetBetAmount(actions: PreviousAction[], street: Exclude<Street, 'preflop'>): number {
  return actions
    .filter((action) => action.street === street && (action.action === ActionType.Raise || action.action === ActionType.AllIn))
    .at(-1)?.amount ?? 0;
}

function activePositions(actions: PreviousAction[], hero: Position): Set<Position> {
  const active = new Set<Position>([hero]);
  for (const action of actions) {
    if (action.action === ActionType.Raise || action.action === ActionType.Call || action.action === ActionType.AllIn) {
      active.add(action.position);
    }
  }
  return active;
}

/**
 * 为当前街补一条真实对手下注（必要时先补 Hero 过牌），
 * 使操作历史、合法动作与 EV 输入使用同一个下注额。
 */
export function appendCurrentStreetBet(
  actions: PreviousAction[],
  options: {
    street: Exclude<Street, 'preflop'>;
    heroPosition: Position;
    playerCount: number;
    potSize: number;
    sizingMultiplier: number;
    effectiveStack: number;
  }
): PreviousAction[] {
  const { street, heroPosition, playerCount, potSize, sizingMultiplier, effectiveStack } = options;
  const active = activePositions(actions, heroPosition);
  const order = getActionOrder(playerCount, 'postflop').filter((position) => active.has(position));
  const heroIndex = order.indexOf(heroPosition);
  const others = order.filter((position) => position !== heroPosition);
  if (heroIndex < 0 || others.length === 0) return actions;

  const beforeHero = order.slice(0, heroIndex);
  const aggressor = actions
    .filter((action) => action.street === 'preflop' && action.action === ActionType.Raise)
    .at(-1)?.position;
  const bettor = aggressor !== undefined && beforeHero.includes(aggressor)
    ? aggressor
    : beforeHero.at(-1) ?? others.at(-1)!;

  const history = beforeHero.length === 0
    ? [...actions, { position: heroPosition, action: ActionType.Check, street }]
    : [...actions];
  const amount = Math.round(Math.min(effectiveStack, potSize * sizingMultiplier) * 10) / 10;
  return [...history, { position: bettor, action: ActionType.Raise, amount, street }];
}
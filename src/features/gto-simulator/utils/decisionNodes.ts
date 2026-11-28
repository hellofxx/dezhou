import type { Card, GameVariant } from '@/shared/types/poker';
import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PreviousAction, DecisionNode, HandStrategy } from '../types';
import { generateFlop, generateTurnCard, generateRiverCard, classifyBoardTexture } from './boardGenerator';
import { buildBoard, boardToFlat, estimatePostflopStrategy, getCbetSizingMultiplier } from './postflopStrategy';
import { getPreflopHandStrategy } from './spotKey';
import { appendCurrentStreetBet, computeHeroInvestment, getLastStreetBetAmount, tagStreet } from './actionStory';

// ─── 真实底池累加（P1C-20）───────────────────────

/** 翻前底池按位置累计：SB=.5 / BB=1，raise/call/all-in 到注额取 max。 */
export function computePreflopPot(previousActions: PreviousAction[]): number {
  const positions = new Set<Position>([Position.SB, Position.BB]);
  for (const action of previousActions) {
    if (action.street === undefined || action.street === 'preflop') positions.add(action.position);
  }
  const pot = [...positions].reduce(
    (sum, position) => sum + computeHeroInvestment(previousActions, position, 'preflop'),
    0
  );
  return Math.round(pot * 10) / 10;
}

/** 多步故事线的翻后起始底池与单步场景共用同一贡献额口径。 */
function potAfterPreflopCall(preflopActions: PreviousAction[]): number {
  return computePreflopPot(preflopActions);
}

/**
 * 理论不可达的兜底策略（BUG-GTO-009：PREFLOP_FALLBACK 仅作最后兜底路径；
 * 场景生成已在源头按 GTO 表覆盖约束，正常不应命中——命中即视为数据/生成 bug，见
 * generateScenario 出口过滤的一次性 console.warn 日志）。
 */
const PREFLOP_FALLBACK: HandStrategy = { fold: 0.4, call: 0.3, raise: 0.3, raiseAmount: 2.5 };

// ─── 多步决策节点生成（BUG-GTO-011：自 scenarioGenerator 拆出，纯搬运不改行为）─

export function generateDecisionNodes(
  street: 'preflop' | 'flop' | 'turn' | 'river',
  heroHand: [Card, Card],
  position: Position,
  variant: GameVariant,
  effectiveStack: number,
  difficulty: string,
  playerCount: number,
  rng: () => number = Math.random
): DecisionNode[] {
  const nodes: DecisionNode[] = [];
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);

  // Preflop 节点：hero open 故事线（BB 无 open 场景 → BB vs BTN open）。
  // 这两个分支均命中 GTO 表（非 BB 的 {pos}_open；BB 的 bb_vs_btn_open），
  // 不产生 resolveSpotKey 返回 null 的场景（BUG-GTO-009 约束）。
  const preflopActions = tagStreet(
    position === Position.BB
      ? actionOrder.slice(0, heroIdx).map((pos) =>
          pos === Position.BTN
            ? { position: pos, action: ActionType.Raise, amount: 2.5 }
            : { position: pos, action: ActionType.Fold }
        )
      : actionOrder.slice(0, heroIdx).map((pos) => ({ position: pos, action: ActionType.Fold })),
    'preflop'
  );
  const preflopPot = computePreflopPot(preflopActions);
  // P1C-05：首节点用与单步一致的 preflop 查表逻辑（不再硬编码）
  const preflopStrategy = getPreflopHandStrategy(position, preflopActions, heroHand) ?? PREFLOP_FALLBACK;
  nodes.push({
    id: 'node-preflop',
    street: 'preflop',
    description: `Hero ${position} preflop`,
    descriptionKey: 'gto.nodeDesc.preflop',
    descriptionParams: { position },
    potSize: preflopPot,
    heroHand,
    gtoStrategy: preflopStrategy,
    previousActions: preflopActions,
  });

  // 翻后故事线需要真实对手：非 BB → hero open + 下家 call；BB → BTN open + BB call。
  const caller = actionOrder[heroIdx + 1] ?? actionOrder[heroIdx - 1]!;
  const postflopPreflop = position === Position.BB
    ? tagStreet([
        ...actionOrder.slice(0, heroIdx).map((pos) => (
          pos === Position.BTN
            ? { position: pos, action: ActionType.Raise, amount: 2.5 }
            : { position: pos, action: ActionType.Fold }
        )),
        { position, action: ActionType.Call, amount: 2.5 },
      ], 'preflop')
    : tagStreet([
        { position, action: ActionType.Raise, amount: 2.5 },
        { position: caller, action: ActionType.Call, amount: 2.5 },
      ], 'preflop');
  const betStory = (history: PreviousAction[], betStreet: 'flop' | 'turn' | 'river', pot: number, multiplier: number) =>
    appendCurrentStreetBet(history, {
      street: betStreet,
      heroPosition: position,
      playerCount,
      potSize: pot,
      sizingMultiplier: multiplier,
      effectiveStack,
    });

  // Flop 节点（P1C-01：排除 hero 手牌；P1C-20：真实底池累加）
  const flopPot = potAfterPreflopCall(postflopPreflop);
  const { cards: flopCards, texture: flopTexture } = generateFlop(variant, heroHand, rng);
  const flopBoard = buildBoard(flopCards);
  let flopHistory = betStory(postflopPreflop, 'flop', flopPot, getCbetSizingMultiplier(flopTexture));
  const flopBet = getLastStreetBetAmount(flopHistory, 'flop');
  nodes.push({
    id: 'node-flop',
    street: 'flop',
    description: `Flop pot ${flopPot}BB`,
    descriptionKey: 'gto.nodeDesc.flop',
    descriptionParams: { pot: flopPot },
    board: flopBoard,
    potSize: flopPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, flopBoard, flopTexture, 'flop'),
    previousActions: flopHistory,
  });

  // Turn 节点：flop 双方各投一次 c-bet（尺寸来自 cbet_frequencies）
  const turnPot = Math.round((flopPot + flopBet * 2) * 10) / 10;
  const turnCard = generateTurnCard(flopCards, variant, heroHand, rng);
  const turnBoard = buildBoard(flopCards, turnCard);
  const turnTexture = classifyBoardTexture(boardToFlat(turnBoard));
  flopHistory = [...flopHistory, { position, action: ActionType.Call, amount: flopBet, street: 'flop' }];
  let turnHistory = betStory(flopHistory, 'turn', turnPot, getCbetSizingMultiplier(turnTexture));
  const turnBet = getLastStreetBetAmount(turnHistory, 'turn');
  nodes.push({
    id: 'node-turn',
    street: 'turn',
    description: `Turn pot ${turnPot}BB`,
    descriptionKey: 'gto.nodeDesc.turn',
    descriptionParams: { pot: turnPot },
    board: turnBoard,
    potSize: turnPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, turnBoard, turnTexture, 'turn'),
    previousActions: turnHistory,
  });

  // River 节点：turn 双方各投一次实际历史下注额（尺寸由 texture 与筹码钳制决定）
  const riverPot = Math.round((turnPot + turnBet * 2) * 10) / 10;
  const riverCard = generateRiverCard([...flopCards, turnCard], variant, heroHand, rng);
  const riverBoard = buildBoard(flopCards, turnCard, riverCard);
  const riverTexture = classifyBoardTexture(boardToFlat(riverBoard));
  turnHistory = [...turnHistory, { position, action: ActionType.Call, amount: turnBet, street: 'turn' }];
  const riverHistory = betStory(turnHistory, 'river', riverPot, getCbetSizingMultiplier(riverTexture));
  nodes.push({
    id: 'node-river',
    street: 'river',
    description: `River pot ${riverPot}BB`,
    descriptionKey: 'gto.nodeDesc.river',
    descriptionParams: { pot: riverPot },
    board: riverBoard,
    potSize: riverPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, riverBoard, riverTexture, 'river'),
    previousActions: riverHistory,
  });

  const streetOrder: Array<'preflop' | 'flop' | 'turn' | 'river'> = ['preflop', 'flop', 'turn', 'river'];
  const startIdx = streetOrder.indexOf(street);
  const count = difficulty === 'advanced' ? 3 : 2;
  return nodes.slice(startIdx, startIdx + count);
}

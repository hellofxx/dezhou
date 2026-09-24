import type { Card, GameVariant } from '@/shared/types/poker';
import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PreviousAction, DecisionNode, HandStrategy } from '../types';
import { generateFlop, generateTurnCard, generateRiverCard, classifyBoardTexture } from './boardGenerator';
import { buildBoard, boardToFlat, estimatePostflopStrategy, getCbetSizingMultiplier } from './postflopStrategy';
import { getPreflopHandStrategy } from './spotKey';

// ─── 真实底池累加（P1C-20）───────────────────────

/** 翻前底池 = 盲注 1.5 + 各家已投入（raise/call 金额） */
export function computePreflopPot(previousActions: PreviousAction[]): number {
  return previousActions.reduce((sum, a) => {
    if (a.action === ActionType.Raise || a.action === ActionType.Call) return sum + (a.amount ?? 2.5);
    return sum;
  }, 1.5);
}

/**
 * 多步故事线的翻后起始底池：翻前 open 被 hero（或一人）跟注后进入翻牌。
 * openAmount 双方各投入一次 + 盲注。
 */
function potAfterPreflopCall(preflopActions: PreviousAction[], heroIsOpener: boolean): number {
  const raises = preflopActions.filter((a) => a.action === ActionType.Raise);
  const openAmount = raises[0]?.amount ?? 2.5;
  const callers = preflopActions.filter((a) => a.action === ActionType.Call).length;
  // hero open 被一人 call，或 hero call 对手 open：均为 2 人各投 openAmount
  const players = 2 + (heroIsOpener ? 0 : callers > 0 ? callers - 1 : 0);
  return 1.5 + openAmount * players;
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
  _effectiveStack: number,
  difficulty: string,
  playerCount: number,
  rng: () => number = Math.random
): DecisionNode[] {
  const nodes: DecisionNode[] = [];
  const ts = Date.now();
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);

  // Preflop 节点：hero open 故事线（BB 无 open 场景 → BB vs BTN open）。
  // 这两个分支均命中 GTO 表（非 BB 的 {pos}_open；BB 的 bb_vs_btn_open），
  // 不产生 resolveSpotKey 返回 null 的场景（BUG-GTO-009 约束）。
  const preflopActions: PreviousAction[] =
    position === Position.BB
      ? actionOrder.slice(0, heroIdx).map((pos) =>
          pos === Position.BTN
            ? { position: pos, action: ActionType.Raise, amount: 2.5 }
            : { position: pos, action: ActionType.Fold }
        )
      : actionOrder.slice(0, heroIdx).map((pos) => ({ position: pos, action: ActionType.Fold }));
  const preflopPot = computePreflopPot(preflopActions);
  // P1C-05：首节点用与单步一致的 preflop 查表逻辑（不再硬编码）
  const preflopStrategy = getPreflopHandStrategy(position, preflopActions, heroHand) ?? PREFLOP_FALLBACK;
  nodes.push({
    id: `node-preflop-${ts}`,
    street: 'preflop',
    description: `Hero ${position} preflop`,
    descriptionKey: 'gto.nodeDesc.preflop',
    descriptionParams: { position },
    potSize: preflopPot,
    heroHand,
    gtoStrategy: preflopStrategy,
    previousActions: preflopActions,
  });

  // Flop 节点（P1C-01：排除 hero 手牌；P1C-20：真实底池累加）
  const flopPot = potAfterPreflopCall(preflopActions, position !== Position.BB);
  const { cards: flopCards, texture: flopTexture } = generateFlop(variant, heroHand, rng);
  const flopBoard = buildBoard(flopCards);
  nodes.push({
    id: `node-flop-${ts}`,
    street: 'flop',
    description: `Flop pot ${flopPot}BB`,
    descriptionKey: 'gto.nodeDesc.flop',
    descriptionParams: { pot: flopPot },
    board: flopBoard,
    potSize: flopPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, flopBoard, flopTexture, 'flop'),
    previousActions: [{ position, action: ActionType.Call, amount: 2.5 }],
  });

  // Turn 节点：flop 双方各投一次 c-bet（尺寸来自 cbet_frequencies）
  const flopBet = Math.round(flopPot * getCbetSizingMultiplier(flopTexture) * 10) / 10;
  const turnPot = Math.round((flopPot + flopBet * 2) * 10) / 10;
  const turnCard = generateTurnCard(flopCards, variant, heroHand, rng);
  const turnBoard = buildBoard(flopCards, turnCard);
  const turnTexture = classifyBoardTexture(boardToFlat(turnBoard));
  nodes.push({
    id: `node-turn-${ts}`,
    street: 'turn',
    description: `Turn pot ${turnPot}BB`,
    descriptionKey: 'gto.nodeDesc.turn',
    descriptionParams: { pot: turnPot },
    board: turnBoard,
    potSize: turnPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, turnBoard, turnTexture, 'turn'),
    previousActions: [{ position, action: ActionType.Call, amount: flopBet }],
  });

  // River 节点：turn 双方各投一次 2/3 pot
  const turnBet = Math.round(turnPot * 0.66 * 10) / 10;
  const riverPot = Math.round((turnPot + turnBet * 2) * 10) / 10;
  const riverCard = generateRiverCard([...flopCards, turnCard], variant, heroHand, rng);
  const riverBoard = buildBoard(flopCards, turnCard, riverCard);
  const riverTexture = classifyBoardTexture(boardToFlat(riverBoard));
  nodes.push({
    id: `node-river-${ts}`,
    street: 'river',
    description: `River pot ${riverPot}BB`,
    descriptionKey: 'gto.nodeDesc.river',
    descriptionParams: { pot: riverPot },
    board: riverBoard,
    potSize: riverPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, riverBoard, riverTexture, 'river'),
    previousActions: [{ position, action: ActionType.Call, amount: turnBet }],
  });

  const streetOrder: Array<'preflop' | 'flop' | 'turn' | 'river'> = ['preflop', 'flop', 'turn', 'river'];
  const startIdx = streetOrder.indexOf(street);
  const count = difficulty === 'advanced' ? 3 : 2;
  return nodes.slice(startIdx, startIdx + count);
}

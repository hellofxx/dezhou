import type { Card, GameVariant, Board } from '@/shared/types/poker';
import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { Scenario, ScenarioConfig, PreviousAction, DecisionNode, HandStrategy } from '../types';
import { generateFlop, generateTurnCard, generateRiverCard, classifyBoardTexture } from './boardGenerator';
import type { BoardTexture } from './boardGenerator';
import { selectHandForDifficulty } from './handDifficulty';
import { buildBoard, boardToFlat, estimatePostflopStrategy, getCbetSizingMultiplier } from './postflopStrategy';
import { getPreflopHandStrategy } from './spotKey';

// ─── 前置动作生成（支持 Multiway）─────────────────

export function generatePreviousActions(
  street: 'preflop' | 'flop' | 'turn' | 'river',
  position: Position,
  playerCount: number,
  _difficulty: string
): PreviousAction[] {
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);
  const playersBefore = actionOrder.slice(0, heroIdx);
  const playersAfter = actionOrder.slice(heroIdx + 1);

  if (street === 'preflop') {
    if (playersBefore.length === 0 && playersAfter.length === 0) return [];

    const roll = Math.random();

    // 30%: 前面全部 fold，hero 第一个行动（open 场景）
    if (roll < 0.30 || playersBefore.length === 0) {
      return playersBefore.map((pos) => ({ position: pos, action: ActionType.Fold }));
    }

    // 30%: 一人 open，其余 fold（面对 open 场景）
    if (roll < 0.60) {
      const openerIdx = Math.floor(Math.random() * playersBefore.length);
      return playersBefore.map((pos, i) =>
        i === openerIdx
          ? { position: pos, action: ActionType.Raise, amount: 2.5 }
          : { position: pos, action: ActionType.Fold }
      );
    }

    // 20%: 一人 open + 一人 call（multiway 场景）
    if (roll < 0.80 && playersBefore.length >= 2) {
      const openerIdx = Math.floor(Math.random() * (playersBefore.length - 1));
      let callerIdx = openerIdx + 1 + Math.floor(Math.random() * (playersBefore.length - openerIdx - 1));
      if (callerIdx >= playersBefore.length) callerIdx = playersBefore.length - 1;
      return playersBefore.map((pos, i) => {
        if (i === openerIdx) return { position: pos, action: ActionType.Raise, amount: 2.5 };
        if (i === callerIdx) return { position: pos, action: ActionType.Call, amount: 2.5 };
        return { position: pos, action: ActionType.Fold };
      });
    }

    // 20%: hero open 后遭 3-bet（P1C-25：previousActions 显式包含 hero 的 open，
    // 3-bettor 取 hero 之后的位置，语境完整：前面 fold → hero open 2.5 → 后位 3bet 8）
    if (playersAfter.length > 0) {
      const threeBettor = playersAfter[Math.floor(Math.random() * playersAfter.length)]!;
      return [
        ...playersBefore.map((pos) => ({ position: pos, action: ActionType.Fold })),
        { position, action: ActionType.Raise, amount: 2.5 },
        { position: threeBettor, action: ActionType.Raise, amount: 8 },
      ];
    }
    // hero 是最后行动位（BB）：退化为面对 open
    const openerIdx = Math.floor(Math.random() * playersBefore.length);
    return playersBefore.map((pos, i) =>
      i === openerIdx
        ? { position: pos, action: ActionType.Raise, amount: 2.5 }
        : { position: pos, action: ActionType.Fold }
    );
  }

  // 翻后：模拟翻前 open + call（可含 multiway）
  const aggressorIdx = Math.max(0, heroIdx - 1);
  const postActions: PreviousAction[] = [
    { position: actionOrder[aggressorIdx]!, action: ActionType.Raise, amount: 2.5 },
    { position, action: ActionType.Call, amount: 2.5 },
  ];
  if (playerCount >= 3 && heroIdx >= 2 && Math.random() < 0.3) {
    const callerIdx = Math.max(0, heroIdx - 2);
    postActions.splice(1, 0, { position: actionOrder[callerIdx]!, action: ActionType.Call, amount: 2.5 });
  }
  return postActions;
}

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

// ─── 多步决策节点生成 ───────────────────────────

const PREFLOP_FALLBACK: HandStrategy = { fold: 0.4, call: 0.3, raise: 0.3, raiseAmount: 2.5 };

export function generateDecisionNodes(
  street: 'preflop' | 'flop' | 'turn' | 'river',
  heroHand: [Card, Card],
  position: Position,
  variant: GameVariant,
  _effectiveStack: number,
  difficulty: string,
  playerCount: number
): DecisionNode[] {
  const nodes: DecisionNode[] = [];
  const ts = Date.now();
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);

  // Preflop 节点：hero open 故事线（BB 无 open 场景 → BB vs BTN open）
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
    description: `Hero 在 ${position} 面对翻前行动`,
    potSize: preflopPot,
    heroHand,
    gtoStrategy: preflopStrategy,
    previousActions: preflopActions,
  });

  // Flop 节点（P1C-01：排除 hero 手牌；P1C-20：真实底池累加）
  const flopPot = potAfterPreflopCall(preflopActions, position !== Position.BB);
  const { cards: flopCards, texture: flopTexture } = generateFlop(variant, heroHand);
  const flopBoard = buildBoard(flopCards);
  nodes.push({
    id: `node-flop-${ts}`,
    street: 'flop',
    description: `翻牌圈，底池 ${flopPot}BB`,
    board: flopBoard,
    potSize: flopPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, flopBoard, flopTexture, 'flop'),
    previousActions: [{ position, action: ActionType.Call, amount: 2.5 }],
  });

  // Turn 节点：flop 双方各投一次 c-bet（尺寸来自 cbet_frequencies）
  const flopBet = Math.round(flopPot * getCbetSizingMultiplier(flopTexture) * 10) / 10;
  const turnPot = Math.round((flopPot + flopBet * 2) * 10) / 10;
  const turnCard = generateTurnCard(flopCards, variant, heroHand);
  const turnBoard = buildBoard(flopCards, turnCard);
  const turnTexture = classifyBoardTexture(boardToFlat(turnBoard));
  nodes.push({
    id: `node-turn-${ts}`,
    street: 'turn',
    description: `转牌圈，底池 ${turnPot}BB`,
    board: turnBoard,
    potSize: turnPot,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, turnBoard, turnTexture, 'turn'),
    previousActions: [{ position, action: ActionType.Call, amount: flopBet }],
  });

  // River 节点：turn 双方各投一次 2/3 pot
  const turnBet = Math.round(turnPot * 0.66 * 10) / 10;
  const riverPot = Math.round((turnPot + turnBet * 2) * 10) / 10;
  const riverCard = generateRiverCard([...flopCards, turnCard], variant, heroHand);
  const riverBoard = buildBoard(flopCards, turnCard, riverCard);
  const riverTexture = classifyBoardTexture(boardToFlat(riverBoard));
  nodes.push({
    id: `node-river-${ts}`,
    street: 'river',
    description: `河牌圈，底池 ${riverPot}BB`,
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

// ─── 场景生成 ───────────────────────────────────

export function pickStreet(difficulty: string): 'preflop' | 'flop' | 'turn' | 'river' {
  const roll = Math.random();
  if (difficulty === 'beginner') return roll < 0.80 ? 'preflop' : 'flop';
  if (difficulty === 'intermediate') {
    if (roll < 0.65) return 'preflop';
    return roll < 0.90 ? 'flop' : 'turn';
  }
  if (roll < 0.50) return 'preflop';
  if (roll < 0.75) return 'flop';
  return roll < 0.90 ? 'turn' : 'river';
}

export function generateScenario(config: ScenarioConfig, index: number): Scenario {
  const variant = config.gameVariant ?? 'standard';
  const heroHand = selectHandForDifficulty(config.difficulty, variant);
  const street = pickStreet(config.difficulty);
  const stakes = { smallBlind: 0.5, bigBlind: 1 };

  let board: Board | undefined;
  let boardTexture: BoardTexture | undefined;
  let potSize = 1.5;
  let previousActions: PreviousAction[] = [];

  if (street === 'preflop') {
    previousActions = generatePreviousActions('preflop', config.position, config.playerCount, config.difficulty);
    potSize = computePreflopPot(previousActions);
  } else {
    previousActions = generatePreviousActions(street, config.position, config.playerCount, config.difficulty);
    const preflopPot = computePreflopPot(previousActions);
    // P1C-01：发公共牌时排除 hero 手牌，确保 hero 2 张 + board 5 张全局唯一
    const { cards: flopCards, texture: flopTexture } = generateFlop(variant, heroHand);

    if (street === 'flop') {
      board = buildBoard(flopCards);
      boardTexture = flopTexture;
      potSize = preflopPot;
    } else if (street === 'turn') {
      const turnCard = generateTurnCard(flopCards, variant, heroHand);
      board = buildBoard(flopCards, turnCard);
      // P1C-21：turn 重算 texture（不再沿用 flop texture）
      boardTexture = classifyBoardTexture(boardToFlat(board));
      const flopBet = flopTexture ? preflopPot * getCbetSizingMultiplier(flopTexture) : preflopPot * 0.5;
      potSize = Math.round((preflopPot + flopBet * 2) * 10) / 10;
    } else {
      const turnCard = generateTurnCard(flopCards, variant, heroHand);
      const riverCard = generateRiverCard([...flopCards, turnCard], variant, heroHand);
      board = buildBoard(flopCards, turnCard, riverCard);
      // P1C-21：river 重算 texture
      boardTexture = classifyBoardTexture(boardToFlat(board));
      const flopBet = preflopPot * getCbetSizingMultiplier(flopTexture);
      const turnPot = preflopPot + flopBet * 2;
      const turnBet = turnPot * 0.66;
      potSize = Math.round((turnPot + turnBet * 2) * 10) / 10;
    }
  }

  const spr = Math.round((config.effectiveStack / potSize) * 10) / 10;

  const multiStepProb = config.difficulty === 'advanced' ? 0.5 : config.difficulty === 'intermediate' ? 0.3 : 0.1;
  const useMultiStep = Math.random() < multiStepProb;
  const decisionNodes = useMultiStep
    ? generateDecisionNodes(street, heroHand, config.position, variant, config.effectiveStack, config.difficulty, config.playerCount)
    : undefined;

  const streetLabel = street === 'preflop' ? 'Preflop' : street === 'flop' ? 'Flop' : street === 'turn' ? 'Turn' : 'River';

  return {
    id: `scenario-${Date.now()}-${index}`,
    name: `${config.position} ${streetLabel} 决策`,
    description: `${config.playerCount}-max ${config.gameType}, ${config.effectiveStack}BB, SPR ${spr}`,
    gameType: config.gameType,
    stakes,
    effectiveStack: config.effectiveStack,
    position: config.position,
    playerCount: config.playerCount,
    gameVariant: variant,
    street,
    board,
    potSize,
    spr,
    boardTexture,
    previousActions,
    heroHand,
    difficulty: config.difficulty,
    decisionNodes,
  };
}
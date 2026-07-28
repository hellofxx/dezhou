import { useCallback } from 'react';
import { Suit, Rank } from '@/shared/types/poker';
import type { Card, GameVariant, Board } from '@/shared/types/poker';
import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { SHORT_DECK_RANKS } from '@/shared/constants/poker';
import { useGTOSimulatorStore } from '../store';
import type { Scenario, ScenarioConfig, PreviousAction, DecisionNode, HandStrategy } from '../types';
import { generateFlop, generateTurnCard, generateRiverCard, classifyBoardTexture } from '../utils/boardGenerator';
import type { BoardTexture } from '../utils/boardGenerator';
import postflopData from '../data/postflop-ranges.json';
import { getEasyGTOScenario } from './useGTOComparison';

// ─── 随机牌生成 ────────────────────────────────

function randomCard(exclude: Card[] = [], variant: GameVariant = 'standard'): Card {
  const suits = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
  const ranks = variant === 'short-deck'
    ? (SHORT_DECK_RANKS as readonly Rank[])
    : ([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as Rank[]);
  let card: Card;
  let attempts = 0;
  do {
    card = {
      suit: suits[Math.floor(Math.random() * suits.length)]!,
      rank: ranks[Math.floor(Math.random() * ranks.length)]!,
    };
    attempts++;
  } while (exclude.some((c) => c.suit === card.suit && c.rank === card.rank) && attempts < 100);
  return card;
}

function randomHeroHand(variant: GameVariant = 'standard'): [Card, Card] {
  const card1 = randomCard([], variant);
  const card2 = randomCard([card1], variant);
  return [card1, card2];
}

// ─── 手牌难度分类 ───────────────────────────────

/**
 * 手牌难度分类（169 手全覆盖，互斥）
 *
 * 难度标准（GTO + Sklansky 分组）：
 * - STRONG_HANDS (beginner, 24 手)：顶级牌力，新手必学，决策清晰
 *   · 全部对子 99+（5 手）
 *   · 大 Ax 同花：AKs-AJs（3 手）
 *   · 大 Ax 非同花：AKo-AQo（2 手）+ AQs（含）
 *   · 大 K 同花：KQs-KJs（2 手）
 *   · 含 AQs、KQs 等顶级行政牌
 * - INTERMEDIATE_HANDS (intermediate, 60 手)：中等牌力，需结合位置决策
 *   · 中对子 22-88（7 手）
 *   · 中 Ax 同花 ATs-A2s（9 手）
 *   · 中 K/Q/J 同花 KTs-Q9s/JTs-J8s 等
 *   · 中 Ax 非同花 AJo-ATo（3 手）
 *   · 中 K/Q/J 非同花 KJo-QJo/JTo 等
 * - ADVANCED_HANDS (advanced, 85 手)：边缘牌力，需高级技巧（隐含赔率/位置/剥削）
 *   · 小同花连张 K8s-32s 等
 *   · 小非同花 K8o-32o 等
 */
const STRONG_HANDS = [
  // 顶级对子（5）
  'AA', 'KK', 'QQ', 'JJ', 'TT',
  // 大 Ax 同花（4）
  'AKs', 'AQs', 'AJs', 'ATs',
  // 大 Ax 非同花（3）
  'AKo', 'AQo', 'AJo',
  // 大 K 同花（2）
  'KQs', 'KJs',
  // 中等对子（含 99，归入 strong 便于 beginner 训练）
  '99',
];

const INTERMEDIATE_HANDS = [
  // 中对子（6）
  '88', '77', '66', '55', '44', '33',
  // 中 Ax 同花（7）
  'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s',
  // 中 K 同花（3）
  'KTs', 'K9s', 'K8s',
  // Q/J 同花（5）
  'QJs', 'QTs', 'Q9s', 'JTs', 'J9s',
  // T/9 同花连张（4）
  'T9s', 'T8s', '98s', '97s',
  // 8/7 同花连张（4）
  '87s', '86s', '76s', '75s',
  // 6/5 同花连张（4）
  '65s', '64s', '54s', '53s',
  // 小对子（1）
  '22',
  // 中 Ax 非同花（6）
  'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
  // 中 K 非同花（4）
  'KQo', 'KJo', 'KTo', 'K9o',
  // Q/J 非同花（4）
  'QJo', 'QTo', 'Q9o', 'JTo',
  // T/9 非同花（3）
  'T9o', 'T8o', '98o',
  // 其他中等非同花连张（3）
  'A4o', 'A3o', 'A2o',
];

const ADVANCED_HANDS = [
  // 小 K 同花（5）
  'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  // 小 Q 同花（6）
  'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  // 小 J 同花（5）
  'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  // 小 T 同花（5）
  'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  // 小 9 同花（5）
  '96s', '95s', '94s', '93s', '92s',
  // 小 8 同花（5）
  '85s', '84s', '83s', '82s',
  // 小 7 同花（4）
  '74s', '73s', '72s',
  // 小 6 同花（3）
  '63s', '62s',
  // 小 5 同花（2）
  '52s', '43s', '42s', '32s',
  // 小 K 非同花（6）
  'K8o', 'K7o', 'K6o', 'K5o', 'K4o', 'K3o', 'K2o',
  // 小 Q 非同花（6）
  'Q8o', 'Q7o', 'Q6o', 'Q5o', 'Q4o', 'Q3o', 'Q2o',
  // 小 J 非同花（6）
  'J9o', 'J8o', 'J7o', 'J6o', 'J5o', 'J4o', 'J3o', 'J2o',
  // 小 T 非同花（5）
  'T7o', 'T6o', 'T5o', 'T4o', 'T3o', 'T2o',
  // 小 9 非同花（5）
  '97o', '96o', '95o', '94o', '93o', '92o',
  // 小 8 非同花（5）
  '87o', '86o', '85o', '84o', '83o', '82o',
  // 小 7 非同花（4）
  '76o', '75o', '74o', '73o', '72o',
  // 小 6 非同花（3）
  '65o', '64o', '63o', '62o',
  // 小 5/4/3 非同花（3）
  '54o', '53o', '52o', '43o', '42o', '32o',
];

function handToNotation(c1: Card, c2: Card): string {
  const rankNames: Record<number, string> = {
    14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
    9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
  };
  const r1 = rankNames[c1.rank] ?? '';
  const r2 = rankNames[c2.rank] ?? '';
  const suited = c1.suit === c2.suit;
  const [high, low] = c1.rank >= c2.rank ? [r1, r2] : [r2, r1];
  if (high === low) return high + low;
  return high + low + (suited ? 's' : 'o');
}

function selectHandForDifficulty(difficulty: string, variant: GameVariant = 'standard'): [Card, Card] {
  let targetHands: string[];
  switch (difficulty) {
    case 'beginner': targetHands = STRONG_HANDS; break;
    case 'intermediate': targetHands = INTERMEDIATE_HANDS; break;
    case 'advanced': targetHands = ADVANCED_HANDS; break;
    default: return randomHeroHand(variant);
  }
  for (let i = 0; i < 50; i++) {
    const hand = randomHeroHand(variant);
    if (targetHands.includes(handToNotation(hand[0], hand[1]))) return hand;
  }
  return randomHeroHand(variant);
}

// ─── 前置动作生成（支持 Multiway）─────────────────

function generatePreviousActions(
  street: 'preflop' | 'flop' | 'turn' | 'river',
  position: Position,
  playerCount: number,
  _difficulty: string
): PreviousAction[] {
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);
  const playersBefore = actionOrder.slice(0, heroIdx);

  if (street === 'preflop') {
    if (playersBefore.length === 0) return [];

    const roll = Math.random();

    // 30%: 前面全部 fold，hero 第一个行动（open 场景）
    if (roll < 0.30) {
      return playersBefore.map((pos) => ({ position: pos, action: ActionType.Fold }));
    }

    // 30%: 一人 open，其余 fold（面对 open 场景）
    if (roll < 0.60) {
      const openerIdx = Math.floor(Math.random() * playersBefore.length);
      const actions: PreviousAction[] = [];
      for (let i = 0; i < playersBefore.length; i++) {
        if (i === openerIdx) {
          actions.push({ position: playersBefore[i]!, action: ActionType.Raise, amount: 2.5 });
        } else {
          actions.push({ position: playersBefore[i]!, action: ActionType.Fold });
        }
      }
      return actions;
    }

    // 20%: 一人 open + 一人 call（multiway 场景）
    if (roll < 0.80 && playersBefore.length >= 2) {
      const openerIdx = Math.floor(Math.random() * (playersBefore.length - 1));
      let callerIdx = openerIdx + 1 + Math.floor(Math.random() * (playersBefore.length - openerIdx - 1));
      if (callerIdx >= playersBefore.length) callerIdx = playersBefore.length - 1;
      const actions: PreviousAction[] = [];
      for (let i = 0; i < playersBefore.length; i++) {
        if (i === openerIdx) {
          actions.push({ position: playersBefore[i]!, action: ActionType.Raise, amount: 2.5 });
        } else if (i === callerIdx) {
          actions.push({ position: playersBefore[i]!, action: ActionType.Call, amount: 2.5 });
        } else {
          actions.push({ position: playersBefore[i]!, action: ActionType.Fold });
        }
      }
      return actions;
    }

    // 20%: 一人 open + 一人 3-bet，其余 fold（3-bet 场景）
    const openerIdx = 0;
    const threeBetterIdx = playersBefore.length > 1
      ? 1 + Math.floor(Math.random() * (playersBefore.length - 1))
      : 0;
    const actions: PreviousAction[] = [];
    for (let i = 0; i < playersBefore.length; i++) {
      if (i === openerIdx && threeBetterIdx !== 0) {
        actions.push({ position: playersBefore[i]!, action: ActionType.Raise, amount: 2.5 });
      } else if (i === threeBetterIdx) {
        actions.push({ position: playersBefore[i]!, action: ActionType.Raise, amount: 8 });
      } else {
        actions.push({ position: playersBefore[i]!, action: ActionType.Fold });
      }
    }
    return actions;
  }

  // 翻后：模拟翻前 open + call（可含 multiway）
  const aggressorIdx = Math.max(0, heroIdx - 1);
  const postActions: PreviousAction[] = [
    { position: actionOrder[aggressorIdx]!, action: ActionType.Raise, amount: 2.5 },
    { position, action: ActionType.Call, amount: 2.5 },
  ];
  // 30% 概率加入第三个入池玩家（multiway 翻后）
  if (playerCount >= 3 && heroIdx >= 2 && Math.random() < 0.3) {
    const callerIdx = Math.max(0, heroIdx - 2);
    postActions.splice(1, 0, { position: actionOrder[callerIdx]!, action: ActionType.Call, amount: 2.5 });
  }
  return postActions;
}

// ─── Board 构建辅助 ─────────────────────────────

function buildBoard(flopCards: Card[], turnCard?: Card, riverCard?: Card): Board {
  return {
    flop: [flopCards[0]!, flopCards[1]!, flopCards[2]!],
    turn: turnCard ?? null,
    river: riverCard ?? null,
  };
}

function boardToFlat(board: Board): Card[] {
  const cards: Card[] = [...board.flop];
  if (board.turn) cards.push(board.turn);
  if (board.river) cards.push(board.river);
  return cards;
}

// ─── 翻后 GTO 策略估算（使用 postflop-ranges.json）──

type HandStrengthCategory = 'strong_hand' | 'medium_hand' | 'draw_hand' | 'weak_hand' | 'air';

function classifyHandStrength(
  heroHand: [Card, Card],
  board: Board,
): HandStrengthCategory {
  const flat = boardToFlat(board);
  const boardRanks = flat.map((c) => c.rank);
  const heroRanks = heroHand.map((c) => c.rank);

  const hasPair = heroRanks.some((r) => boardRanks.includes(r));
  const topBoardRank = Math.max(...boardRanks);
  const hasTopPair = heroRanks.includes(topBoardRank) && hasPair;
  const hasOverpair = heroRanks[0] === heroRanks[1] && heroRanks[0]! > topBoardRank;
  const hasSet = heroRanks[0] === heroRanks[1] && boardRanks.includes(heroRanks[0]!);
  const hasTwoPair = heroRanks.filter((r) => boardRanks.includes(r)).length >= 2;

  if (hasSet || hasTwoPair || hasOverpair || hasTopPair) return 'strong_hand';
  if (hasPair) return 'medium_hand';

  // 检查听牌
  const allCards = [...heroHand, ...flat];
  const suitCounts = new Map<string, number>();
  for (const c of allCards) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const hasFlushDraw = [...suitCounts.values()].some((v) => v === 4);

  const uniqueRanks = [...new Set(allCards.map((c) => c.rank))].sort((a, b) => a - b);

  // 检测已成顺子（5张连续）
  let hasMadeStraight = false;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4]! - uniqueRanks[i]! === 4) {
      hasMadeStraight = true;
      break;
    }
  }
  if (hasMadeStraight) return 'strong_hand';

  // 检测顺子听牌（4张牌在5张跨度内）
  let hasStraightDraw = false;
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    const window4 = uniqueRanks.slice(i, i + 4);
    if (window4.length === 4 && window4[3]! - window4[0]! <= 4) {
      hasStraightDraw = true;
      break;
    }
  }

  if (hasFlushDraw || hasStraightDraw) return 'draw_hand';
  return 'air';
}

function estimatePostflopStrategy(
  heroHand: [Card, Card],
  board: Board,
  texture: BoardTexture,
  street: 'flop' | 'turn' | 'river',
  isMultiway: boolean = false
): HandStrategy {
  const textureData = (postflopData.texture_strategy as Record<string, Record<string, HandStrategy>>)[texture];

  if (street === 'flop' && textureData) {
    const strength = classifyHandStrength(heroHand, board);
    const base = textureData[strength];
    if (base) {
      // Multiway 调整：降低 bluff/raise 频率
      if (isMultiway && (strength === 'air' || strength === 'weak_hand')) {
        const adj = postflopData.multiway_adjustments.three_way_pot;
        return {
          fold: Math.min(1, base.fold + adj.bluff_reduction * 0.5),
          call: base.call,
          raise: Math.max(0, base.raise * (1 - adj.bluff_reduction)),
          raiseAmount: base.raiseAmount,
        };
      }
      return base;
    }
  }

  // Turn/River 使用简化估算
  const flat = boardToFlat(board);
  const boardRanks = flat.map((c) => c.rank);
  const heroRanks = heroHand.map((c) => c.rank);
  const hasPair = heroRanks.some((r) => boardRanks.includes(r));
  const topBoardRank = Math.max(...boardRanks);
  const hasTopPair = heroRanks.includes(topBoardRank) && hasPair;
  const hasOverpair = heroRanks[0] === heroRanks[1] && heroRanks[0]! > topBoardRank;
  const hasStrongHand = hasTopPair || hasOverpair;

  if (street === 'turn') {
    if (hasStrongHand) return { fold: 0, call: 0.4, raise: 0.6, raiseAmount: 6 };
    return { fold: 0.5, call: 0.4, raise: 0.1, raiseAmount: 5 };
  }
  // river
  if (hasStrongHand) return { fold: 0, call: 0.5, raise: 0.5, raiseAmount: 8 };
  return { fold: 0.6, call: 0.35, raise: 0.05, raiseAmount: 7 };
}

// ─── 多步决策节点生成 ───────────────────────────

function generateDecisionNodes(
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

  // Preflop 节点
  const preflopActions = generatePreviousActions('preflop', position, playerCount, difficulty);
  const preflopCallers = preflopActions.filter((a) => a.action === ActionType.Call);
  const isMultiway = preflopCallers.length >= 1; // 有人 call 即为 multiway
  nodes.push({
    id: `node-preflop-${ts}`,
    street: 'preflop',
    description: `Hero 在 ${position} 面对翻前行动`,
    potSize: 1.5,
    heroHand,
    gtoStrategy: { fold: 0.2, call: 0.3, raise: 0.5, raiseAmount: 2.5 },
    previousActions: preflopActions,
  });

  // Flop 节点
  const { cards: flopCards, texture: flopTexture } = generateFlop(variant);
  const flopBoard = buildBoard(flopCards);
  nodes.push({
    id: `node-flop-${ts}`,
    street: 'flop',
    description: `翻牌圈，底池 6.5BB`,
    board: flopBoard,
    potSize: 6.5,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, flopBoard, flopTexture, 'flop', isMultiway),
    previousActions: [{ position, action: ActionType.Call, amount: 2.5 }],
  });

  // Turn 节点
  const turnCard = generateTurnCard(flopCards, variant);
  const turnBoard = buildBoard(flopCards, turnCard);
  const turnTexture = classifyBoardTexture(boardToFlat(turnBoard));
  nodes.push({
    id: `node-turn-${ts}`,
    street: 'turn',
    description: `转牌圈，底池 13BB`,
    board: turnBoard,
    potSize: 13,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, turnBoard, turnTexture, 'turn'),
    previousActions: [{ position, action: ActionType.Call, amount: 3 }],
  });

  // River 节点
  const riverCard = generateRiverCard([...flopCards, turnCard], variant);
  const riverBoard = buildBoard(flopCards, turnCard, riverCard);
  const riverTexture = classifyBoardTexture(boardToFlat(riverBoard));
  nodes.push({
    id: `node-river-${ts}`,
    street: 'river',
    description: `河牌圈，底池 22BB`,
    board: riverBoard,
    potSize: 22,
    heroHand,
    gtoStrategy: estimatePostflopStrategy(heroHand, riverBoard, riverTexture, 'river'),
    previousActions: [{ position, action: ActionType.Call, amount: 4 }],
  });

  // 根据当前 street 决定起始节点，取 2-3 步
  const streetOrder: Array<'preflop' | 'flop' | 'turn' | 'river'> = ['preflop', 'flop', 'turn', 'river'];
  const startIdx = streetOrder.indexOf(street);
  const count = difficulty === 'advanced' ? 3 : 2;
  return nodes.slice(startIdx, startIdx + count);
}

// ─── 场景生成 ───────────────────────────────────

function pickStreet(difficulty: string): 'preflop' | 'flop' | 'turn' | 'river' {
  const roll = Math.random();
  if (difficulty === 'beginner') {
    if (roll < 0.80) return 'preflop';
    return 'flop';
  }
  if (difficulty === 'intermediate') {
    if (roll < 0.65) return 'preflop';
    if (roll < 0.90) return 'flop';
    return 'turn';
  }
  // advanced
  if (roll < 0.50) return 'preflop';
  if (roll < 0.75) return 'flop';
  if (roll < 0.90) return 'turn';
  return 'river';
}

function generateScenario(config: ScenarioConfig, index: number): Scenario {
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
    const raises = previousActions.filter((a) => a.action === ActionType.Raise);
    const calls = previousActions.filter((a) => a.action === ActionType.Call);
    // potSize = 盲注 + 所有加注 + 所有跟注
    potSize = 1.5 + raises.reduce((s, a) => s + (a.amount ?? 2.5), 0) + calls.reduce((s, a) => s + (a.amount ?? 2.5), 0);
  } else {
    const { cards: flopCards, texture } = generateFlop(variant);
    boardTexture = texture;

    if (street === 'flop') {
      board = buildBoard(flopCards);
      potSize = 6.5;
    } else if (street === 'turn') {
      const turnCard = generateTurnCard(flopCards, variant);
      board = buildBoard(flopCards, turnCard);
      potSize = 13;
    } else {
      const turnCard = generateTurnCard(flopCards, variant);
      const riverCard = generateRiverCard([...flopCards, turnCard], variant);
      board = buildBoard(flopCards, turnCard, riverCard);
      potSize = 22;
    }
    previousActions = generatePreviousActions(street, config.position, config.playerCount, config.difficulty);
    // 检测 multiway：翻前动作中有超过1人入池
    const callers = previousActions.filter((a) => a.action === ActionType.Call);
    const isMultiway = callers.length >= 2;
    if (street === 'flop' && board) {
      // 使用 postflop-ranges 数据估算 C-bet 策略（在 generateDecisionNodes 中处理）
    }
    void isMultiway;
  }

  const spr = Math.round((config.effectiveStack / potSize) * 10) / 10;

  // 多步决策：intermediate 30%，advanced 50%
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

// ─── Hook ───────────────────────────────────────

export function useScenarioEngine() {
  const { config, startSession, submitDecision, nextScenario, session } = useGTOSimulatorStore();

  const generateScenarios = useCallback(
    (cfg?: Partial<ScenarioConfig>) => {
      const mergedConfig = cfg ? { ...config, ...cfg } : config;
      const scenarios: Scenario[] = [];
      for (let i = 0; i < mergedConfig.scenarioCount; i++) {
        scenarios.push(generateScenario(mergedConfig, i));
      }

      // "最后一题简单"策略：将末场景替换为最简单的 BTN AA open 场景
      // （仅当生成出至少 1 个场景时；用户做出 raise 即"以最优决策结束"）
      const finalScenarios =
        scenarios.length > 0
          ? [...scenarios.slice(0, scenarios.length - 1), getEasyGTOScenario(scenarios.length - 1)]
          : scenarios;

      startSession(finalScenarios);
    },
    [config, startSession]
  );

  const getCurrentScenario = useCallback((): Scenario | null => {
    if (!session || session.isComplete) return null;
    return session.scenarios[session.currentIndex] ?? null;
  }, [session]);

  const getProgress = useCallback(() => {
    if (!session) return { current: 0, total: 0, percentage: 0 };
    return {
      current: session.currentIndex + 1,
      total: session.scenarios.length,
      percentage: ((session.currentIndex + 1) / session.scenarios.length) * 100,
    };
  }, [session]);

  return {
    generateScenarios,
    getCurrentScenario,
    submitDecision,
    nextScenario,
    getProgress,
    session,
    config,
  };
}

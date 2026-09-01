import type { Board } from '@/shared/types/poker';
import { Position, getActionOrder } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { Scenario, ScenarioConfig, PreviousAction } from '../types';
import { generateFlop, generateTurnCard, generateRiverCard, classifyBoardTexture } from './boardGenerator';
import type { BoardTexture } from './boardGenerator';
import { selectHandForDifficulty } from './handDifficulty';
import { buildBoard, boardToFlat, getCbetSizingMultiplier } from './postflopStrategy';
import { resolveSpotKey } from './spotKey';
import { computePreflopPot, generateDecisionNodes } from './decisionNodes';
import { seededRandom } from '@/shared/utils/seededShuffle';

// ─── 前置动作生成（支持 Multiway）─────────────────

/**
 * BUG-GTO-009：preflop 前置动作只在表覆盖的 spot 内生成（数据权威 =
 * preflop-ranges.json 的 11 个 spot），且禁止伪造/凭空生成 GTO 策略数据。
 *
 * 表内可达 spot（6-max 行动顺序上的实际归属）：
 *   - hero 非 BB 且前面全 fold → {pos}_open（utg/hj/co/btn/sb_open）
 *   - hero = BB 且 opener ∈ {HJ, CO, BTN} → bb_vs_{hj,co,btn}_open
 *
 * 不在此生成的场景（原实现会静默 fallback 混合策略判分失真）：
 *   - open 分支 hero = BB（bb_open 无表）
 *   - "面对 open" 且 hero 非 BB，或 opener ∉ {HJ,CO,BTN}（表未覆盖）
 *   - multiway（表无 multiway spot）
 *   - 3bet 分支：表内仅 btn_vs_co_3bet / co_vs_hj_3bet 两个 key，其"villain 为最后一个
 *     非 hero raiser"的语境需 CO/HJ 先 open 再遭 3bet 之类序列，本生成器
 *     "hero open 后后位 3bet"的配置在行动顺序上不可达，且数据语义需确认
 *     （P1A-06 挂起）——故暂停生成 3bet 分支。
 */
export function generatePreviousActions(
  street: 'preflop' | 'flop' | 'turn' | 'river',
  position: Position,
  playerCount: number,
  _difficulty: string,
  rng: () => number = Math.random
): PreviousAction[] {
  const actionOrder = getActionOrder(playerCount, 'preflop');
  const heroIdx = actionOrder.indexOf(position);
  const playersBefore = actionOrder.slice(0, heroIdx);
  const playersAfter = actionOrder.slice(heroIdx + 1);

  if (street === 'preflop') {
    if (playersBefore.length === 0 && playersAfter.length === 0) return [];

    // BB：仅 "BB vs {HJ,CO,BTN} open" 有表（bb_vs_hj/co/btn_open）。
    // 这些位置在 6-max 行动顺序上均位于 BB 之后动作位之前，必然可表命中的 opener。
    if (position === Position.BB) {
      const validOpeners = playersBefore.filter((p) => p === Position.HJ || p === Position.CO || p === Position.BTN);
      if (validOpeners.length === 0) {
        // 极小桌（如 2-max 的 BB 前仅 SB）无表内 opener：退化为纯 fold → BB limping，
        // 该情形无 open，交由出口过滤兜底（理论不应进入正常训练流）。
        return playersBefore.map((pos) => ({ position: pos, action: ActionType.Fold }));
      }
      const opener = validOpeners[Math.floor(rng() * validOpeners.length)]!;
      return playersBefore.map((pos) =>
        pos === opener
          ? { position: pos, action: ActionType.Raise, amount: 2.5 }
          : { position: pos, action: ActionType.Fold }
      );
    }

    // 非 BB：前面全 fold，hero 第一个行动（{pos}_open 有表），无 3bet/multiway 分支。
    return playersBefore.map((pos) => ({ position: pos, action: ActionType.Fold }));
  }

  // 翻后：模拟翻前 open + call（可含 multiway）
  // hero 是翻前首个行动位（如 UTG）时，"前一位"就是 hero 自己——旧实现会生成
  // [hero raise, hero call] 的自相矛盾序列。改为 hero open、紧邻下家跟注。
  if (heroIdx === 0) {
    const caller = playersAfter[0] ?? actionOrder[actionOrder.length - 1]!;
    return [
      { position, action: ActionType.Raise, amount: 2.5 },
      { position: caller, action: ActionType.Call, amount: 2.5 },
    ];
  }
  const aggressorIdx = heroIdx - 1;
  const postActions: PreviousAction[] = [
    { position: actionOrder[aggressorIdx]!, action: ActionType.Raise, amount: 2.5 },
    { position, action: ActionType.Call, amount: 2.5 },
  ];
  if (playerCount >= 3 && heroIdx >= 2 && rng() < 0.3) {
    const callerIdx = Math.max(0, heroIdx - 2);
    postActions.splice(1, 0, { position: actionOrder[callerIdx]!, action: ActionType.Call, amount: 2.5 });
  }
  return postActions;
}

// ─── 场景生成（BUG-GTO-011：前置动作 / 底池累加 / 多步节点已拆出）────────

export function pickStreet(difficulty: string, rng: () => number = Math.random): 'preflop' | 'flop' | 'turn' | 'river' {
  const roll = rng();
  if (difficulty === 'beginner') return roll < 0.80 ? 'preflop' : 'flop';
  if (difficulty === 'intermediate') {
    if (roll < 0.65) return 'preflop';
    return roll < 0.90 ? 'flop' : 'turn';
  }
  if (roll < 0.50) return 'preflop';
  if (roll < 0.75) return 'flop';
  return roll < 0.90 ? 'turn' : 'river';
}

/** 开发环境一次性 preflop fallback 日志守卫（防止重复刷屏；生产不输出） */
let loggedPreflopFallback = false;
function warnPreflopFallbackOnce(position: Position): void {
  if (!import.meta.env.DEV) return;
  if (loggedPreflopFallback) return;
  loggedPreflopFallback = true;
  // eslint-disable-next-line no-console
  console.warn(
    `[gto-simulator] BUG-GTO-009: 生成的 preflop 场景未命中 GTO 表（resolveSpotKey 返回 null）。` +
      `hero=${position}。该 spot 无 GTO 数据，已过滤该场景。若高频出现说明生成约束与表覆盖仍有缺口，需检查 scenarioGenerator.generatePreviousActions。`
  );
}

/**
 * 生成单个场景。BUG-GTO-012：接受可选 seed，提供时用 seededRandom 派生确定性
 * RNG（同一 config+index+seed 产出完全相同的场景）；缺省时保持 Math.random
 * 现网随机行为。
 *
 * BUG-GTO-009：生成出口处过滤 resolveSpotKey 返回 null 的 preflop 场景
 * （源头约束已保证命中，此处为防御性兜底 + 一次性 warn 日志）。
 */
export function generateScenario(config: ScenarioConfig, index: number, seed?: number): Scenario {
  const rng = seed === undefined ? Math.random : seededRandom(seed);
  const variant = config.gameVariant ?? 'standard';
  const heroHand = selectHandForDifficulty(config.difficulty, variant, rng);
  const street = pickStreet(config.difficulty, rng);
  const stakes = { smallBlind: 0.5, bigBlind: 1 };

  let board: Board | undefined;
  let boardTexture: BoardTexture | undefined;
  let potSize = 1.5;
  let previousActions: PreviousAction[] = [];

  if (street === 'preflop') {
    previousActions = generatePreviousActions('preflop', config.position, config.playerCount, config.difficulty, rng);
    potSize = computePreflopPot(previousActions);
    // BUG-GTO-009：出口过滤——preflop 场景必须命中 GTO 表。若源头约束失效返回
    // null 的 spot，视为理论不可达 / 生成缺陷，强制回退到已保证命中的 open 场景。
    if (resolveSpotKey(config.position, previousActions) === null) {
      warnPreflopFallbackOnce(config.position);
      const order = getActionOrder(config.playerCount, 'preflop');
      // 回退：非 BB → hero open（{pos}_open 有表）；BB → BB vs BTN open（bb_vs_btn_open 有表）
      previousActions =
        config.position === Position.BB
          ? order.slice(0, -1).map((pos) =>
              pos === Position.BTN
                ? { position: pos as Position, action: ActionType.Raise, amount: 2.5 }
                : { position: pos as Position, action: ActionType.Fold }
            )
          : order
              .slice(0, order.indexOf(config.position))
              .map((pos) => ({ position: pos as Position, action: ActionType.Fold }));
      potSize = computePreflopPot(previousActions);
    }
  } else {
    previousActions = generatePreviousActions(street, config.position, config.playerCount, config.difficulty, rng);
    const preflopPot = computePreflopPot(previousActions);
    // P1C-01：发公共牌时排除 hero 手牌，确保 hero 2 张 + board 5 张全局唯一
    const { cards: flopCards, texture: flopTexture } = generateFlop(variant, heroHand, rng);

    if (street === 'flop') {
      board = buildBoard(flopCards);
      boardTexture = flopTexture;
      potSize = preflopPot;
    } else if (street === 'turn') {
      const turnCard = generateTurnCard(flopCards, variant, heroHand, rng);
      board = buildBoard(flopCards, turnCard);
      // P1C-21：turn 重算 texture（不再沿用 flop texture）
      boardTexture = classifyBoardTexture(boardToFlat(board));
      const flopBet = flopTexture ? preflopPot * getCbetSizingMultiplier(flopTexture) : preflopPot * 0.5;
      potSize = Math.round((preflopPot + flopBet * 2) * 10) / 10;
    } else {
      const turnCard = generateTurnCard(flopCards, variant, heroHand, rng);
      const riverCard = generateRiverCard([...flopCards, turnCard], variant, heroHand, rng);
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
  const useMultiStep = rng() < multiStepProb;
  const decisionNodes = useMultiStep
    ? generateDecisionNodes(street, heroHand, config.position, variant, config.effectiveStack, config.difficulty, config.playerCount, rng)
    : undefined;

  const streetLabel = street === 'preflop' ? 'Preflop' : street === 'flop' ? 'Flop' : street === 'turn' ? 'Turn' : 'River';

  return {
    id: `scenario-${seed === undefined ? `${Date.now()}-${index}` : `${seed}-${index}`}`,
    // 纯英文结构化标识（避免硬编码中文导致英文界面下出现"BTN Turn 决策"中英混杂）。
    name: `${config.position} ${streetLabel}`,
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

// 向后兼容导出（BUG-GTO-011：多步节点生成已拆至 utils/decisionNodes.ts）。
export { generateDecisionNodes } from './decisionNodes';

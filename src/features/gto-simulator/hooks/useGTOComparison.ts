import { useMemo, useCallback } from 'react';
import type { HandNotation } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { classifyHand } from '@/shared/utils/handClassifier';
import type { Card } from '@/shared/types/poker';
import type { HandStrategy, PreviousAction, Scenario } from '../types';
import { ActionType } from '@/shared/types/action';
import { getOptimalAction, isPureStrategy, compareDecision } from '../utils/strategyCompare';
import { resolveSpotKey as resolveSpotKeyUtil } from '../utils/spotKey';
import type { Decision } from '@/shared/types/action';
import preflopData from '../data/preflop-ranges.json';
import { useProgressStore } from '@/features/progress/store';
import type { Difficulty } from '@/shared/types/common';
// P1-3.2: SRS 集成
import {
  answerQuality,
  upsertReviewItem,
} from '@/features/progress/utils/spacedRepetition';
// P2-2.3: 五级反馈
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { calculateGrade } from '@/shared/types/decisionFeedback';
import type { CompareResult } from '../utils/strategyCompare';

type PreflopData = Record<string, Record<string, Record<string, HandStrategy>>>;

/**
 * 返回最简单的 GTO 场景：BTN 持 AA，前面全部 fold，hero 第一个行动（open 场景）。
 * GTO 推荐几乎 100% raise，是最易做出"最优决策"的场景。
 *
 * 用于"最后一题简单"策略：让用户以正确结束训练。
 *
 * 注：useGTOComparison 本身只做策略对比，不管理场景流；
 * 调用方（useScenarioEngine / GTO store）使用本辅助函数实现"最后一题简单 + 补救"逻辑。
 */
export function getEasyGTOScenario(index: number = 0): Scenario {
  // 构造 AA（红桃 A + 方块 A），避免依赖随机数
  const aceOfHearts: Card = { suit: Suit.Hearts, rank: Rank.Ace };
  const aceOfDiamonds: Card = { suit: Suit.Diamonds, rank: Rank.Ace };
  const heroHand: [Card, Card] = [aceOfHearts, aceOfDiamonds];

  // GTO 策略：BTN AA 几乎 100% raise（pure strategy）
  const gtoStrategy: HandStrategy = { fold: 0, call: 0, raise: 1, raiseAmount: 2.5 };

  return {
    id: `scenario-easy-${Date.now()}-${index}`,
    name: 'BTN AA Open',
    // 存 i18n key：SRS metadata.front 直接使用，ReviewSession 渲染时 t() 翻译
    description: 'gto.easyScenario.prompt',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    gameVariant: 'standard',
    street: 'preflop',
    board: undefined,
    potSize: 1.5,
    spr: Math.round((100 / 1.5) * 10) / 10,
    boardTexture: undefined,
    previousActions: [
      { position: Position.UTG, action: ActionType.Fold },
      { position: Position.HJ, action: ActionType.Fold },
      { position: Position.CO, action: ActionType.Fold },
    ],
    heroHand,
    difficulty: 'beginner',
    // 单步决策节点，gtoStrategy 直接给 raise
    decisionNodes: [
      {
        id: `node-easy-${Date.now()}-${index}`,
        street: 'preflop',
        description: 'BTN AA preflop action',
        descriptionKey: 'gto.easyScenario.nodeDesc',
        potSize: 1.5,
        heroHand,
        gtoStrategy,
        previousActions: [
          { position: Position.UTG, action: ActionType.Fold },
          { position: Position.HJ, action: ActionType.Fold },
          { position: Position.CO, action: ActionType.Fold },
        ],
      },
    ],
  };
}

/**
 * 根据 previousActions 确定 preflop spot key。
 *
 * 仅返回 GTO 频率表中实际存在的 key；未覆盖场景返回 null，由调用方提示用户
 * "该场景暂未覆盖"，避免错误地降级为 open 场景误导初学者。
 *
 * 覆盖场景（与 preflop-ranges.json 中的 11 个 spot 一致）：
 *   - 0 raise: `${pos}_open`（utg/hj/co/btn/sb open；BB 无 open 场景，返回 null）
 *   - 1 raise + hero=BB: `bb_vs_${opener}_open`（opener ∈ {hj, co, btn}；utg 未覆盖）
 *   - 1 raise + hero=SB: `sb_vs_${opener}_open`（仅 sb_vs_bb_open 命中，6-max 中罕见）
 *   - ≥2 raise: `${pos}_vs_${lastRaiser}_3bet`（仅 btn_vs_co_3bet / co_vs_hj_3bet 命中）
 *
 * 未覆盖场景示例（返回 null）：
 *   - HJ/CO/BTN 冷 call（如 UTG open → HJ 行动）：GTO 表无 `hj_vs_utg_open` 等 key
 *   - SB vs UTG/HJ/CO/BTN open：GTO 表无 `sb_vs_utg_open` 等 key
 *   - BB vs UTG open：GTO 表无 `bb_vs_utg_open`
 *   - 大多数 3bet 场景：仅 btn_vs_co_3bet、co_vs_hj_3bet 命中
 */
function resolveSpotKey(position: Position, previousActions?: PreviousAction[]): string | null {
  const pos = position.toLowerCase();
  const data = (preflopData as PreflopData)['6max_100bb_preflop'];
  if (!data) return null;

  // 没有任何动作或全是 fold：hero 是 open raiser
  const raises = previousActions?.filter((a) => a.action === ActionType.Raise) ?? [];
  if (raises.length === 0) {
    const key = `${pos}_open`;
    return data[key] ? key : null;
  }

  // 面对一个 open（raises.length === 1）：hero 是跟注/3bet 决策者
  if (raises.length === 1) {
    const opener = raises[0]!;
    const openerPos = opener.position.toLowerCase();
    // BB 防御：bb_vs_${opener}_open
    if (pos === 'bb') {
      const key = `bb_vs_${openerPos}_open`;
      return data[key] ? key : null;
    }
    // SB 防御：sb_vs_${opener}_open（GTO 表仅覆盖 sb_vs_bb_open，6-max 中罕见）
    if (pos === 'sb') {
      const key = `sb_vs_${openerPos}_open`;
      return data[key] ? key : null;
    }
    // HJ/CO/BTN 冷 call 场景：GTO 表未覆盖，返回 null 由调用方提示
    return null;
  }

  // 面对 3bet 及以上（raises.length >= 2）：hero 是 4bet/call/fold 决策者
  const lastRaiser = raises[raises.length - 1]!;
  const key = `${pos}_vs_${lastRaiser.position.toLowerCase()}_3bet`;
  return data[key] ? key : null;
}

/**
 * GTO策略对比hook
 */
export function useGTOComparison(
  heroHand: [Card, Card] | null,
  position: Position | null,
  previousActions?: PreviousAction[]
) {
  const handNotation = useMemo(() => {
    if (!heroHand) return null;
    return classifyHand(heroHand[0], heroHand[1]);
  }, [heroHand]);

  // 获取当前手牌的GTO策略
  const gtoStrategy = useMemo((): HandStrategy | null => {
    if (!position || !handNotation) return null;

    const spotKey = resolveSpotKey(position, previousActions);
    if (!spotKey) return null; // 场景未覆盖，由 UI 提示用户

    const data = (preflopData as PreflopData)['6max_100bb_preflop'];
    if (!data) return null;

    const spotData = data[spotKey];
    if (!spotData) return null;

    return spotData[handNotation] ?? null;
  }, [position, handNotation, previousActions]);

  // 获取整个位置的所有策略（用于热力图）
  const allStrategies = useMemo((): Record<HandNotation, HandStrategy> | null => {
    if (!position) return null;

    const spotKey = resolveSpotKey(position, previousActions);
    if (!spotKey) return null; // 场景未覆盖

    const data = (preflopData as PreflopData)['6max_100bb_preflop'];
    if (!data) return null;

    return data[spotKey] ?? null;
  }, [position, previousActions]);

  // 比较用户决策
  const evaluateDecision = (decision: Decision, potSize: number, heroEquity: number = 0.5, callAmount: number = 1) => {
    if (!gtoStrategy) return null;
    return compareDecision(decision, gtoStrategy, potSize, heroEquity, callAmount);
  };

  // 最优动作
  const optimalAction = useMemo(() => {
    if (!gtoStrategy) return null;
    return getOptimalAction(gtoStrategy);
  }, [gtoStrategy]);

  // 是否为纯策略
  const isPure = useMemo(() => {
    if (!gtoStrategy) return false;
    return isPureStrategy(gtoStrategy);
  }, [gtoStrategy]);

  return {
    handNotation,
    gtoStrategy,
    allStrategies,
    optimalAction,
    isPure,
    evaluateDecision,
  };
}

/**
 * P1-2.4: GTO 训练 ELO 记录器（维度=postflop）
 *
 * 调用方（GTOSessionPage）在 submitDecision 后调用返回的 recordEloForAnswer 函数。
 * 难度推断：
 *   - 若 scenario.difficulty 字段存在，映射为 0.3/0.6/0.9
 *   - 否则根据当前 postflop ELO 推断（高分用户题目难度高，简化映射：ELO 0-3000 → 难度 0-1）
 */
const GTO_DIFFICULTY_MAP: Record<Difficulty, number> = {
  beginner: 0.3,
  intermediate: 0.6,
  advanced: 0.9,
};

export function useGtoEloRecorder() {
  const updateElo = useProgressStore((s) => s.updateElo);
  const postflopElo = useProgressStore((s) => s.eloByVariant[s.activeVariant].postflop);

  return useCallback(
    (isCorrect: boolean, difficulty?: Difficulty | number) => {
      let diff: number;
      if (typeof difficulty === 'number') {
        diff = Math.min(1, Math.max(0, difficulty));
      } else if (typeof difficulty === 'string') {
        diff = GTO_DIFFICULTY_MAP[difficulty] ?? 0.5;
      } else {
        diff = Math.min(1, Math.max(0, postflopElo / 3000));
      }
      updateElo('postflop', isCorrect, diff);
    },
    [updateElo, postflopElo]
  );
}

/**
 * P1-3.2: GTO 训练 SRS 记录器
 *
 * 调用方（GTOSessionPage）在 submitDecision 后调用返回的 recordSrsForAnswer 函数。
 * 题目 → ReviewItem 映射：使用 `gto:${scenario.id}` 作为 id，metadata 携带
 * 场景描述与最优动作，复习模式可渲染为决策自评。
 *
 * 注：GTO 训练为开放式决策（无固定选项），复习模式回退为自评 UI：
 * 用户对照 back（最优动作）自评是否记得，quality 由用户在 ReviewSession 中选择。
 * 此处仅在训练答题时注册/更新到复习队列，quality 由 isOptimal 推断。
 *
 * quality 评分：最优决策且用时<5秒→5，最优决策→4，非最优→1
 */
export function useGtoSrsRecorder() {
  const addReviewItem = useProgressStore((s) => s.addReviewItem);
  const updateReviewItem = useProgressStore((s) => s.updateReviewItem);
  const reviewItems = useProgressStore((s) => s.reviewItems);

  return useCallback(
    (scenario: Scenario, isOptimal: boolean, timeTakenMs: number) => {
      // P1C-07: 稳定语义键（不含时间戳），确保同一 spot+手牌 能去重
      const spotKey = resolveSpotKeyUtil(scenario.position, scenario.previousActions) ?? 'unknown';
      const handNotation = classifyHand(scenario.heroHand[0], scenario.heroHand[1]);
      const id = `gto:${spotKey}:${handNotation}`;
      const label = scenario.name || scenario.description.slice(0, 40);
      // 最优动作描述：从首决策节点取 gtoStrategy 推断
      const firstNode = scenario.decisionNodes?.[0];
      const optimalActionText = firstNode
        ? getOptimalAction(firstNode.gtoStrategy)
        : null;
      const metadata = {
        front: scenario.description,
        back: optimalActionText
          ? `${optimalActionText.action}${optimalActionText.amount ? ` ${optimalActionText.amount}BB` : ''}`
          : '（参考 GTO 策略）',
        source: 'gto' as const,
        scenario: scenario.description,
      };

      const { item: updated, isNew } = upsertReviewItem(
        reviewItems,
        id,
        label,
        'gto',
        metadata,
        answerQuality(isOptimal, timeTakenMs),
      );

      if (isNew) {
        addReviewItem(updated);
      } else {
        updateReviewItem(updated);
      }
    },
    [reviewItems, addReviewItem, updateReviewItem]
  );
}

/**
 * P2-2.3: 根据 GTO CompareResult 构造五级 DecisionFeedback。
 *
 * GTO 比较直接基于 evLoss 用 calculateGrade 分级：
 *  - evLoss = 0 → 'best'
 *  - evLoss < 0.5 → 'correct'
 *  - evLoss < 2 → 'inaccuracy'
 *  - evLoss < 5 → 'wrong'
 *  - evLoss >= 5 → 'blunder'
 *
 * 调用方（GTOSessionPage）在拿到 store.feedback 后调用本函数，
 * 将结果作为 GTOFeedback 的 feedback prop 传入即可启用五级显示。
 */
export function buildGtoFeedback(
  result: CompareResult,
  correctAction: string,
  relatedLessonId?: string,
): DecisionFeedback {
  const grade = calculateGrade(result.evLoss);
  return {
    grade,
    evLoss: result.evLoss,
    correctAction,
    explanation: result.explanation,
    relatedLessonId,
  };
}

/**
 * P2-5.2: GTO 训练情绪管理记录器
 *
 * 调用方（GTOSessionPage）在 submitDecision 后调用返回的 recordAnswerForEmotion 函数。
 * 内部转发到 progressStore.recordAnswer，用于更新连续答错数 / 每日题量 / accuracyHistory。
 */
export function useGtoEmotionRecorder() {
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  return useCallback(
    (isCorrect: boolean) => {
      recordAnswer(isCorrect);
    },
    [recordAnswer]
  );
}

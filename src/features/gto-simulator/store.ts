import { create } from 'zustand';
import type { HandNotation } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { Decision } from '@/shared/types/action';
import { ActionType } from '@/shared/types/action';
import type { Scenario, ScenarioConfig, GTOSession, GTODecision, HandStrategy, GTOResult, DecisionNode, PreviousAction } from './types';
import { compareDecision, estimateHeroEquity, adjustForOpponent } from './utils/strategyCompare';
import type { CompareResult } from './utils/strategyCompare';
import { getEasyGTOScenario } from './hooks/useGTOComparison';

export interface GTOFeedbackState extends CompareResult {
  gtoStrategy: HandStrategy | null;
}

interface GTOSimulatorStore {
  // 场景配置
  config: ScenarioConfig;
  setConfig: (partial: Partial<ScenarioConfig>) => void;

  // Exploit 模式
  exploitMode: boolean;
  selectedOpponent: string | null;
  setExploitMode: (enabled: boolean) => void;
  setSelectedOpponent: (id: string | null) => void;

  // 训练会话
  session: GTOSession | null;
  startSession: (scenarios: Scenario[]) => void;
  submitDecision: (decision: Decision) => void;
  nextScenario: () => void;
  continueNext: () => void; // 多步：下一节点 or 下一场景
  endSession: () => void;
  resetSession: () => void;

  // 多步决策状态
  currentNodeIndex: number;
  stepFeedbacks: GTOFeedbackState[];

  // 当前场景决策状态
  currentDecision: Decision | null;
  setCurrentDecision: (d: Decision | null) => void;
  feedback: GTOFeedbackState | null;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;

  // 策略矩阵查看
  selectedSpotKey: string | null;
  setSelectedSpotKey: (key: string | null) => void;
  highlightedHand: HandNotation | null;
  setHighlightedHand: (hand: HandNotation | null) => void;

  // 结果
  lastResult: GTOResult | null;

  /** "最后一题简单"补救机制：是否已追加过补救场景（避免无限循环） */
  rescueUsed: boolean;
}

const DEFAULT_CONFIG: ScenarioConfig = {
  gameType: 'cash',
  effectiveStack: 100,
  position: Position.BTN,
  playerCount: 6,
  gameVariant: 'standard',
  difficulty: 'intermediate',
  scenarioCount: 20,
};

export const useGTOSimulatorStore = create<GTOSimulatorStore>((set, get) => ({
  config: DEFAULT_CONFIG,

  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  exploitMode: false,
  selectedOpponent: null,
  setExploitMode: (enabled) => set({ exploitMode: enabled }),
  setSelectedOpponent: (id) => set({ selectedOpponent: id }),

  session: null,

  startSession: (scenarios) => {
    set({
      session: {
        scenarios,
        currentIndex: 0,
        decisions: [],
        isComplete: false,
        startTime: Date.now(),
      },
      currentDecision: null,
      feedback: null,
      showFeedback: false,
      currentNodeIndex: 0,
      stepFeedbacks: [],
      rescueUsed: false,
    });
  },

  submitDecision: (decision) => {
    const { session, currentNodeIndex } = get();
    if (!session || session.isComplete) return;

    const scenario = session.scenarios[session.currentIndex];
    if (!scenario) return;

    const nodes = scenario.decisionNodes;
    const node: DecisionNode | undefined = nodes?.[currentNodeIndex];

    // 查找 GTO 策略
    let gtoStrategy = node
      ? node.gtoStrategy
      : getGTOStrategyForScenario(scenario);

    // Exploit 模式：根据对手类型调整策略
    const { exploitMode, selectedOpponent } = get();
    if (exploitMode && selectedOpponent) {
      gtoStrategy = adjustForOpponent(gtoStrategy, selectedOpponent, scenario);
    }

    // 计算 Hero equity
    const nodeBoard = node?.board;
    const nodeStreet = node?.street ?? scenario.street;
    const nodePotSize = node?.potSize ?? scenario.potSize;

    const flatBoard = nodeBoard
      ? [...nodeBoard.flop, ...(nodeBoard.turn ? [nodeBoard.turn] : []), ...(nodeBoard.river ? [nodeBoard.river] : [])]
      : scenario.board
        ? [...scenario.board.flop, ...(scenario.board.turn ? [scenario.board.turn] : []), ...(scenario.board.river ? [scenario.board.river] : [])]
        : undefined;

    const heroEquity = estimateHeroEquity(scenario.heroHand, flatBoard, nodeStreet);
    const callAmount = Math.max(1, nodePotSize * 0.15);

    const result = compareDecision(decision, gtoStrategy, nodePotSize, heroEquity, callAmount);

    const gtoDecision: GTODecision = {
      scenarioId: scenario.id,
      userAction: decision,
      gtoStrategy,
      evLoss: result.evLoss,
      isOptimal: result.isOptimal,
      timeTaken: Date.now() - (session.startTime || Date.now()),
    };

    const feedbackState: GTOFeedbackState = { ...result, gtoStrategy };

    set({
      currentDecision: decision,
      feedback: feedbackState,
      showFeedback: true,
      stepFeedbacks: [...get().stepFeedbacks, feedbackState],
      session: {
        ...session,
        decisions: [...session.decisions, gtoDecision],
      },
    });
  },

  continueNext: () => {
    const { session, currentNodeIndex } = get();
    if (!session) return;

    const scenario = session.scenarios[session.currentIndex];
    if (!scenario) return;

    const nodes = scenario.decisionNodes;
    if (nodes && currentNodeIndex < nodes.length - 1) {
      // 进入下一个决策节点
      set({
        currentNodeIndex: currentNodeIndex + 1,
        currentDecision: null,
        feedback: null,
        showFeedback: false,
      });
    } else {
      // 本场景完成，进入下一场景
      get().nextScenario();
    }
  },

  nextScenario: () => {
    const { session, rescueUsed } = get();
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.scenarios.length) {
      // 即将完成会话：检查"最后一题简单"补救机制
      // 末场景的最后一次决策是否非最优？若是且未用过补救 → 追加一道简单场景
      const lastDecision = session.decisions[session.decisions.length - 1];
      if (lastDecision && !lastDecision.isOptimal && !rescueUsed) {
        const rescueScenario = getEasyGTOScenario(session.scenarios.length);
        set({
          session: {
            ...session,
            scenarios: [...session.scenarios, rescueScenario],
          },
          rescueUsed: true,
          currentDecision: null,
          feedback: null,
          showFeedback: false,
          currentNodeIndex: 0,
          stepFeedbacks: [],
        });
        return;
      }

      const result = computeResult(session);
      set({
        session: { ...session, isComplete: true },
        lastResult: result,
        currentDecision: null,
        feedback: null,
        showFeedback: false,
        currentNodeIndex: 0,
        stepFeedbacks: [],
      });
    } else {
      set({
        session: { ...session, currentIndex: nextIndex },
        currentDecision: null,
        feedback: null,
        showFeedback: false,
        currentNodeIndex: 0,
        stepFeedbacks: [],
      });
    }
  },

  endSession: () => {
    const { session } = get();
    if (!session) return;
    const result = computeResult(session);
    set({
      session: { ...session, isComplete: true },
      lastResult: result,
    });
  },

  resetSession: () => {
    set({
      session: null,
      currentDecision: null,
      feedback: null,
      showFeedback: false,
      lastResult: null,
      currentNodeIndex: 0,
      stepFeedbacks: [],
      rescueUsed: false,
    });
  },

  currentNodeIndex: 0,
  stepFeedbacks: [],

  currentDecision: null,
  setCurrentDecision: (d) => set({ currentDecision: d }),

  feedback: null,
  showFeedback: false,
  setShowFeedback: (show) => set({ showFeedback: show }),

  selectedSpotKey: null,
  setSelectedSpotKey: (key) => set({ selectedSpotKey: key }),
  highlightedHand: null,
  setHighlightedHand: (hand) => set({ highlightedHand: hand }),

  lastResult: null,

  rescueUsed: false,
}));

// ─── Helpers ───────────────────────────────────

import preflopData from './data/preflop-ranges.json';
import { classifyHand } from '@/features/range-trainer/utils/handClassifier';

/** 根据 previousActions 确定 preflop spot key */
function determineSpotKey(position: Position, previousActions: PreviousAction[]): string {
  const pos = position.toLowerCase();
  const raises = previousActions.filter((a) => a.action === ActionType.Raise);

  if (raises.length >= 2) {
    // 3-bet 场景：hero open 后有人 3-bet
    const lastRaiser = raises[raises.length - 1]!;
    const key = `${pos}_vs_${lastRaiser.position.toLowerCase()}_3bet`;
    const gameData = (preflopData as Record<string, Record<string, Record<string, HandStrategy>>>)['6max_100bb_preflop'];
    if (gameData?.[key]) return key;
  }

  if (raises.length === 1) {
    const opener = raises[0]!;
    // BB 面对 open
    if (pos === 'bb') {
      const key = `bb_vs_${opener.position.toLowerCase()}_open`;
      const gameData = (preflopData as Record<string, Record<string, Record<string, HandStrategy>>>)['6max_100bb_preflop'];
      if (gameData?.[key]) return key;
    }
    // SB open vs BB
    if (pos === 'sb') {
      const gameData = (preflopData as Record<string, Record<string, Record<string, HandStrategy>>>)['6max_100bb_preflop'];
      if (gameData?.['sb_vs_bb_open']) return 'sb_vs_bb_open';
    }
  }

  // 默认：位置 open
  return `${pos}_open`;
}

function getGTOStrategyForScenario(scenario: Scenario): HandStrategy {
  const defaultStrategy: HandStrategy = { fold: 0.5, call: 0, raise: 0.5, raiseAmount: 2.5 };

  if (scenario.street !== 'preflop') {
    return defaultStrategy;
  }

  // 根据 previousActions 确定 spot key
  const spotKey = determineSpotKey(scenario.position, scenario.previousActions);
  const gameData = (preflopData as Record<string, Record<string, Record<string, HandStrategy>>>)['6max_100bb_preflop'];

  if (!gameData) return defaultStrategy;

  const spotData = gameData[spotKey];
  if (!spotData) return defaultStrategy;

  // 根据 hero 手牌查找
  const handNotation = classifyHand(scenario.heroHand[0], scenario.heroHand[1]);
  const handStrategy = spotData[handNotation];

  if (!handStrategy) return defaultStrategy;

  return handStrategy as HandStrategy;
}

function computeResult(session: GTOSession): GTOResult {
  const { decisions, scenarios, startTime } = session;
  const optimalCount = decisions.filter((d) => d.isOptimal).length;
  const avgEVLoss = decisions.length > 0
    ? decisions.reduce((sum, d) => sum + d.evLoss, 0) / decisions.length
    : 0;

  // 找最差的spots
  const sorted = [...decisions].sort((a, b) => b.evLoss - a.evLoss);
  const worstSpots = sorted.slice(0, 5).map((d) => ({
    scenario: scenarios.find((s) => s.id === d.scenarioId)!,
    evLoss: d.evLoss,
  })).filter((ws) => ws.scenario);

  return {
    sessionId: `gto-${Date.now()}`,
    scenarios: decisions.length,
    optimalDecisions: optimalCount,
    averageEVLoss: Math.round(avgEVLoss * 100) / 100,
    worstSpots,
    accuracy: decisions.length > 0 ? optimalCount / decisions.length : 0,
    totalTime: Date.now() - startTime,
  };
}

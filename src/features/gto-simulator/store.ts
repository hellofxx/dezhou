import { create } from 'zustand';
import { Position } from '@/shared/types/position';
import type { Decision } from '@/shared/types/action';
import type { Scenario, ScenarioConfig, GTOSession, GTODecision, HandStrategy, GTOResult, DecisionNode } from './types';
import { compareDecision, estimateHeroEquity, adjustForOpponent } from './utils/strategyCompare';
import type { CompareResult } from './utils/strategyCompare';
import { getEasyGTOScenario } from './hooks/useGTOComparison';
import { getPreflopHandStrategy } from './utils/spotKey';
import { estimatePostflopStrategy, boardToFlat, getCbetSizingMultiplier } from './utils/postflopStrategy';
import { classifyBoardTexture } from './utils/boardGenerator';

export interface GTOFeedbackState extends CompareResult {
  gtoStrategy: HandStrategy | null;
  /** P1C-16: exploit 调整后的策略（区别于原始 gtoStrategy） */
  exploitStrategy?: HandStrategy | null;
}

interface GTOSimulatorStore {
  config: ScenarioConfig;
  setConfig: (partial: Partial<ScenarioConfig>) => void;

  exploitMode: boolean;
  selectedOpponent: string | null;
  setExploitMode: (enabled: boolean) => void;
  setSelectedOpponent: (id: string | null) => void;

  session: GTOSession | null;
  startSession: (scenarios: Scenario[]) => void;
  submitDecision: (decision: Decision) => void;
  nextScenario: () => void;
  continueNext: () => void;
  endSession: () => void;
  resetSession: () => void;

  currentNodeIndex: number;
  stepFeedbacks: GTOFeedbackState[];

  currentDecision: Decision | null;
  setCurrentDecision: (d: Decision | null) => void;
  feedback: GTOFeedbackState | null;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;

  /** P1C-19: 每道题开始时间戳（用于计算单题用时） */
  decisionStartAt: number;

  lastResult: GTOResult | null;
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
  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),

  exploitMode: false,
  selectedOpponent: null,
  setExploitMode: (enabled) => set({ exploitMode: enabled }),
  setSelectedOpponent: (id) => set({ selectedOpponent: id }),

  session: null,

  startSession: (scenarios) => {
    set({
      session: { scenarios, currentIndex: 0, decisions: [], isComplete: false, startTime: Date.now() },
      currentDecision: null,
      feedback: null,
      showFeedback: false,
      currentNodeIndex: 0,
      stepFeedbacks: [],
      rescueUsed: false,
      decisionStartAt: Date.now(),
    });
  },

  submitDecision: (decision) => {
    const { session, currentNodeIndex, decisionStartAt } = get();
    if (!session || session.isComplete) return;

    const scenario = session.scenarios[session.currentIndex];
    if (!scenario) return;

    const nodes = scenario.decisionNodes;
    const node: DecisionNode | undefined = nodes?.[currentNodeIndex];

    // P1C-03/04: 统一 GTO 策略查找（preflop 查表 + postflop texture_strategy）
    let gtoStrategy = node ? node.gtoStrategy : getGTOStrategyForScenario(scenario);

    // P1C-16: Exploit 模式保留原始 gtoStrategy，同时传递 exploit 调整后策略
    const { exploitMode, selectedOpponent } = get();
    let exploitStrategy: HandStrategy | null = null;
    if (exploitMode && selectedOpponent) {
      exploitStrategy = adjustForOpponent(gtoStrategy, selectedOpponent, scenario);
      // 判分使用 exploit 策略
      gtoStrategy = exploitStrategy;
    }

    const nodeBoard = node?.board;
    const nodeStreet = node?.street ?? scenario.street;
    const nodePotSize = node?.potSize ?? scenario.potSize;

    const flatBoard = nodeBoard
      ? [...nodeBoard.flop, ...(nodeBoard.turn ? [nodeBoard.turn] : []), ...(nodeBoard.river ? [nodeBoard.river] : [])]
      : scenario.board
        ? [...scenario.board.flop, ...(scenario.board.turn ? [scenario.board.turn] : []), ...(scenario.board.river ? [scenario.board.river] : [])]
        : undefined;

    const heroEquity = estimateHeroEquity(scenario.heroHand, flatBoard, nodeStreet);

    // P1C-12: 真实 callAmount（preflop: 最后一个 raise 减去 hero 已投入；postflop: pot × cbet sizing）
    const callAmount = computeCallAmount(scenario, node, nodePotSize);

    const result = compareDecision(decision, gtoStrategy, nodePotSize, heroEquity, callAmount);

    // P1C-19: timeTaken 使用每题开始时间戳
    const gtoDecision: GTODecision = {
      scenarioId: scenario.id,
      userAction: decision,
      gtoStrategy: exploitMode && exploitStrategy ? exploitStrategy : gtoStrategy,
      evLoss: result.evLoss,
      isOptimal: result.isOptimal,
      timeTaken: Date.now() - decisionStartAt,
    };

    const feedbackState: GTOFeedbackState = { ...result, gtoStrategy: exploitMode ? exploitStrategy : gtoStrategy, exploitStrategy };

    set({
      currentDecision: decision,
      feedback: feedbackState,
      showFeedback: true,
      stepFeedbacks: [...get().stepFeedbacks, feedbackState],
      session: { ...session, decisions: [...session.decisions, gtoDecision] },
    });
  },

  continueNext: () => {
    const { session, currentNodeIndex } = get();
    if (!session) return;

    const scenario = session.scenarios[session.currentIndex];
    if (!scenario) return;

    const nodes = scenario.decisionNodes;
    if (nodes && currentNodeIndex < nodes.length - 1) {
      set({ currentNodeIndex: currentNodeIndex + 1, currentDecision: null, feedback: null, showFeedback: false, decisionStartAt: Date.now() });
    } else {
      get().nextScenario();
    }
  },

  nextScenario: () => {
    const { session, rescueUsed } = get();
    if (!session) return;

    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.scenarios.length) {
      const lastDecision = session.decisions[session.decisions.length - 1];
      if (lastDecision && !lastDecision.isOptimal && !rescueUsed) {
        const rescueScenario = getEasyGTOScenario(session.scenarios.length);
        // P1 fix: 追加 rescue 场景后同步 currentIndex 指向新场景下标（追加前长度即新下标），
        // 避免 submitDecision 中 session.scenarios[currentIndex] 取到旧场景导致决策绑定错误、进度错乱、下一次 nextScenario 跳过救援场景
        set({
          session: {
            ...session,
            scenarios: [...session.scenarios, rescueScenario],
            currentIndex: session.scenarios.length,
          },
          rescueUsed: true,
          currentDecision: null, feedback: null, showFeedback: false, currentNodeIndex: 0, stepFeedbacks: [], decisionStartAt: Date.now(),
        });
        return;
      }
      const result = computeResult(session);
      set({ session: { ...session, isComplete: true }, lastResult: result, currentDecision: null, feedback: null, showFeedback: false, currentNodeIndex: 0, stepFeedbacks: [] });
    } else {
      set({ session: { ...session, currentIndex: nextIndex }, currentDecision: null, feedback: null, showFeedback: false, currentNodeIndex: 0, stepFeedbacks: [], decisionStartAt: Date.now() });
    }
  },

  endSession: () => {
    const { session } = get();
    if (!session) return;
    const result = computeResult(session);
    set({ session: { ...session, isComplete: true }, lastResult: result });
  },

  resetSession: () => {
    set({ session: null, currentDecision: null, feedback: null, showFeedback: false, lastResult: null, currentNodeIndex: 0, stepFeedbacks: [], rescueUsed: false, decisionStartAt: Date.now() });
  },

  currentNodeIndex: 0,
  stepFeedbacks: [],
  currentDecision: null,
  setCurrentDecision: (d) => set({ currentDecision: d }),
  feedback: null,
  showFeedback: false,
  setShowFeedback: (show) => set({ showFeedback: show }),
  decisionStartAt: Date.now(),
  lastResult: null,
  rescueUsed: false,
}));

// ─── Helpers ───────────────────────────────────

/** P1C-03/04: 统一 GTO 策略查找（复用 utils/spotKey + postflopStrategy） */
function getGTOStrategyForScenario(scenario: Scenario): HandStrategy {
  const fallback: HandStrategy = { fold: 0.4, call: 0.3, raise: 0.3, raiseAmount: 2.5 };

  if (scenario.street === 'preflop') {
    // P1C-03: 使用 resolveSpotKey（null 时返回 fallback，日志标记无 GTO 数据）
    return getPreflopHandStrategy(scenario.position, scenario.previousActions, scenario.heroHand) ?? fallback;
  }

  // P1C-04: 翻后接入 postflop-ranges.json texture_strategy
  if (!scenario.board) return fallback;
  const flat = boardToFlat(scenario.board);
  const texture = scenario.boardTexture ?? classifyBoardTexture(flat);
  return estimatePostflopStrategy(scenario.heroHand, scenario.board, texture, scenario.street as 'flop' | 'turn' | 'river');
}

/** P1C-12: 计算真实 callAmount（导出供 GTOSessionPage 复用，保证 UI 显示与内部判分口径一致） */
export function computeCallAmount(scenario: Scenario, node: DecisionNode | undefined, potSize: number): number {
  const actions = node?.previousActions ?? scenario.previousActions;
  const street = node?.street ?? scenario.street;

  if (street === 'preflop') {
    const raises = actions.filter((a) => a.action === 'raise');
    const lastRaise = raises[raises.length - 1];
    if (!lastRaise) return 1; // limping scenario: call 1BB
    return lastRaise.amount ?? 2.5;
  }
  // postflop: 面对 c-bet，callAmount = pot × sizing multiplier
  // P1 fix: 多步节点（turn/river）的 board 已变化，texture 应按 node 实际 board 重新分类，
  // 而非沿用 scenario.boardTexture（flop 时刻缓存），否则 turn/river 节点 callAmount 用错 texture。
  const flat = node?.board ? boardToFlat(node.board) : scenario.board ? boardToFlat(scenario.board) : undefined;
  const texture = flat ? classifyBoardTexture(flat) : scenario.boardTexture;
  return Math.round(potSize * getCbetSizingMultiplier(texture) * 10) / 10;
}

/** P1C-11/24: 计算会话结果 */
function computeResult(session: GTOSession): GTOResult {
  const { decisions, scenarios, startTime } = session;
  const optimalCount = decisions.filter((d) => d.isOptimal).length;
  // P1C-24: 除零防御
  const count = decisions.length || 1;
  const totalEVLoss = decisions.reduce((sum, d) => sum + d.evLoss, 0);
  const avgEVLoss = totalEVLoss / count;

  const sorted = [...decisions].sort((a, b) => b.evLoss - a.evLoss);
  // GTO-10：移除非空断言，scenarioId 缺失时过滤该条目（防御性兜底）
  const worstSpots = sorted.slice(0, 5).flatMap((d) => {
    const scenario = scenarios.find((s) => s.id === d.scenarioId);
    return scenario ? [{ scenario, evLoss: d.evLoss }] : [];
  });

  return {
    sessionId: `gto-${Date.now()}`,
    scenarios: decisions.length,
    optimalDecisions: optimalCount,
    averageEVLoss: Math.round(avgEVLoss * 100) / 100,
    // P1C-11: BB/100 = totalEVLoss / scenarios × 100
    evLossBB100: decisions.length > 0 ? Math.round((totalEVLoss / decisions.length) * 100 * 100) / 100 : 0,
    worstSpots,
    accuracy: decisions.length > 0 ? optimalCount / decisions.length : 0,
    totalTime: Date.now() - startTime,
  };
}

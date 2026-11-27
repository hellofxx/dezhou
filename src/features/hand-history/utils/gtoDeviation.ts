import type { HandHistory } from '../types';
import { ActionType } from '@/shared/types/action';
import { Rank } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';

// ─── Types ────────────────────────────────────────────────

/**
 * 不可用哨兵：Worker 不可用 / 崩溃 / 超时 / 未回传时，gtoAction 与 grade 都写该值。
 * 消费方必须先看 `available`，禁止把哨兵当成 call / best 渲染，避免伪造满分。
 */
export const DEVIATION_UNAVAILABLE = 'unavailable';

export interface DeviationDecision {
  street: string;
  action: string;
  /** 可用时为启发式建议动作；不可用时为 DEVIATION_UNAVAILABLE */
  gtoAction: string;
  evLoss: number;
  /** 可用时为五级评级（best/correct/inaccuracy/wrong/blunder）；不可用时为 DEVIATION_UNAVAILABLE */
  grade: string;
  /** 该决策是否有可用结论；false 时不得计入任何统计或评级展示 */
  available: boolean;
}

export interface DeviationResult {
  handId: string;
  deviations: DeviationDecision[];
  analyzedAt: number;
}

export interface DeviationSummary {
  /** 全部 hero 决策数（含不可用项），仅作分母 / 提示用途 */
  totalDecisions: number;
  /** 可参与统计的决策数（available === true） */
  availableTotal: number;
  /** 不可用决策数（totalDecisions - availableTotal） */
  unavailableCount: number;
  /** 仅统计可用决策中的 best 数 */
  optimalCount: number;
  /** 仅统计可用决策的平均 EV 损失；无可用决策时为 0 */
  averageEvLoss: number;
  /** 仅统计可用决策的最差项；无可用决策时为 null */
  worstDecision: { street: string; evLoss: number } | null;
}

/** Worker 单条分析结果（跨线程负载：`available` 由 worker 标记，缺失即视为不可用） */
export interface WorkerAnalyzeResult {
  id: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
  available?: boolean;
}

// ─── Cache ────────────────────────────────────────────────

const analysisCache = new Map<string, DeviationResult>();

/**
 * Clear the deviation analysis cache (e.g., when hands are deleted).
 */
export function clearDeviationCache(): void {
  analysisCache.clear();
}

// ─── Card helpers ─────────────────────────────────────────

const RANK_ORDER: Record<number, number> = {
  [Rank.Two]: 2, [Rank.Three]: 3, [Rank.Four]: 4, [Rank.Five]: 5,
  [Rank.Six]: 6, [Rank.Seven]: 7, [Rank.Eight]: 8, [Rank.Nine]: 9,
  [Rank.Ten]: 10, [Rank.Jack]: 11, [Rank.Queen]: 12, [Rank.King]: 13, [Rank.Ace]: 14,
};

const RANK_CHAR: Record<number, string> = {
  [Rank.Two]: '2', [Rank.Three]: '3', [Rank.Four]: '4', [Rank.Five]: '5',
  [Rank.Six]: '6', [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9',
  [Rank.Ten]: 'T', [Rank.Jack]: 'J', [Rank.Queen]: 'Q', [Rank.King]: 'K', [Rank.Ace]: 'A',
};

/**
 * Convert two hole cards to hand notation like "AKs", "QQ", "JTo".
 */
function holeCardsToNotation(cards: Card[]): string {
  if (cards.length < 2) return 'AA'; // fallback
  const sorted = [...cards].toSorted((a, b) => (RANK_ORDER[b.rank] ?? 0) - (RANK_ORDER[a.rank] ?? 0));
  const high = sorted[0]!;
  const low = sorted[1]!;
  const r1 = RANK_CHAR[high.rank] ?? '?';
  const r2 = RANK_CHAR[low.rank] ?? '?';
  if (high.rank === low.rank) return `${r1}${r2}`;
  const suited = high.suit === low.suit ? 's' : 'o';
  return `${r1}${r2}${suited}`;
}

// ─── Extract decisions from a hand ────────────────────────

interface DecisionEntry {
  id: string;      // unique key for caching
  hand: string;    // notation like "AKs"
  position: string;
  action: string;  // user's actual action
  street: string;
}

function extractHeroDecisions(hand: HandHistory, heroName: string): DecisionEntry[] {
  const heroIdx = hand.players.findIndex(p => p.name === heroName);
  if (heroIdx === -1) return [];

  const hero = hand.players[heroIdx]!;
  const holeNotation = hero.holeCards ? holeCardsToNotation(hero.holeCards) : 'AA';
  const position = hero.position;
  const decisions: DecisionEntry[] = [];

  const streets: Array<{ key: string; actions: typeof hand.streets.preflop }> = [
    { key: 'preflop', actions: hand.streets.preflop },
    { key: 'flop', actions: hand.streets.flop.actions },
    { key: 'turn', actions: hand.streets.turn.actions },
    { key: 'river', actions: hand.streets.river.actions },
  ];

  for (const { key: street, actions } of streets) {
    for (const action of actions) {
      if (action.playerIndex !== heroIdx) continue;
      const actionStr = action.type === ActionType.AllIn ? 'all-in'
        : action.type === ActionType.Fold ? 'fold'
        : action.type === ActionType.Check ? 'check'
        : action.type === ActionType.Call ? 'call'
        : 'raise';
      decisions.push({
        id: `${hand.id}:${street}:${decisions.length}`,
        hand: holeNotation,
        position,
        action: actionStr,
        street,
      });
    }
  }

  return decisions;
}

// ─── Worker communication ─────────────────────────────────

let workerRef: Worker | null = null;
let msgId = 0;
/** 悬挂中的 worker 请求：崩溃时需要用原始 payload 合成 fallback 结果 */
interface PendingRequest {
  resolve: (result: unknown) => void;
  payload: unknown;
}

const pending = new Map<number, PendingRequest>();

function getWorker(): Worker | null {
  if (workerRef) return workerRef;
  try {
    const worker = new Worker(new URL('../workers/gtoWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const { id, result } = e.data as { id: number; result: unknown };
      const entry = pending.get(id);
      if (entry) {
        entry.resolve(result);
        pending.delete(id);
      }
    };
    // P1 fix: worker 崩溃后置空引用并终止旧实例，下次调用可重建；
    // 否则 workerRef 指向已失效实例，后续 batchAnalyze 全部卡满 10s 超时且永不恢复。
    worker.onerror = () => {
      try {
        worker.terminate();
      } catch {
        // ignore terminate errors
      }
      workerRef = null;
      // worker 崩溃时对所有悬挂请求立即解析 fallback。此前只做 pending.clear()，
      // 超时定时器里的 `pending.has(id)` 随之恒为 false → promise 永不 settle，
      // 分析管线永久挂起（面板停在 loading 且不再恢复）。
      for (const entry of pending.values()) entry.resolve(fallbackAnalyze(entry.payload));
      pending.clear();
    };
    workerRef = worker;
    return worker;
  } catch {
    return null;
  }
}

function sendToWorker<T>(type: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => {
    const worker = getWorker();
    if (!worker) {
      // Worker 构造失败（环境不支持 / 被禁用）：整批标记为不可用，不再伪造 best。
      resolve(fallbackAnalyze(payload) as T);
      return;
    }
    const id = ++msgId;
    // P1 fix: 超时定时器存于闭包，消息成功返回或 worker 崩溃时 clearTimeout，避免悬挂定时器
    let timer: ReturnType<typeof setTimeout> | null = null;
    pending.set(id, {
      payload,
      resolve: (result: unknown) => {
        if (timer !== null) clearTimeout(timer);
        resolve(result as T);
      },
    });
    worker.postMessage({ type, payload, id });
    timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve(fallbackAnalyze(payload) as T);
      }
    }, 10000);
  });
}

function fallbackAnalyze(payload: unknown): WorkerAnalyzeResult[] {
  const hands = (payload as Array<{ id: string }> | null | undefined) ?? [];
  // 失败路径不得伪装成功：明确标记不可用并写哨兵值，UI 据此拒绝展示最优率 / EV。
  return hands.map(h => ({
    id: h.id,
    available: false,
    gtoAction: DEVIATION_UNAVAILABLE,
    evLoss: 0,
    grade: DEVIATION_UNAVAILABLE,
  }));
}

/** 把 worker 回传归一化为决策：只有明确 `available === true` 才采纳其结论。 */
function toDecision(entry: DecisionEntry, wr: WorkerAnalyzeResult | undefined): DeviationDecision {
  if (wr?.available === true) {
    return {
      street: entry.street,
      action: entry.action,
      gtoAction: wr.gtoAction,
      evLoss: wr.evLoss,
      grade: wr.grade,
      available: true,
    };
  }
  return {
    street: entry.street,
    action: entry.action,
    gtoAction: DEVIATION_UNAVAILABLE,
    evLoss: 0,
    grade: DEVIATION_UNAVAILABLE,
    available: false,
  };
}

// ─── Idle scheduler ───────────────────────────────────────

function requestIdle(fn: () => void): void {
  if (typeof globalThis.requestIdleCallback === 'function') {
    globalThis.requestIdleCallback(fn);
  } else {
    setTimeout(fn, 16);
  }
}

// ─── Public API ───────────────────────────────────────────

const BATCH_SIZE = 50;

/**
 * Batch-analyze heuristic strategy deviations for a set of hands.
 * Uses requestIdleCallback and skips already-cached hands.
 * 结果可用性以每条决策的 `available` 表达：worker 不可用 / 崩溃 / 超时 / 未回传均为 false。
 */
export async function analyzeHandDeviations(
  hands: HandHistory[],
  heroName: string,
  onProgress?: (completed: number, total: number) => void,
): Promise<DeviationResult[]> {
  // HH-08：按 handId 聚合跨 batch 的 decisions，避免同一手牌因决策
  // 分散在多个 batch 而产生重复 DeviationResult（progress 按已完成手牌数上报）。
  // 初始 decisions 仅作为待分析输入（toAnalyze），分析结果统一聚合到 resultMap，
  // 全部批次完成后一次构建 DeviationResult。
  const resultMap = new Map<string, DeviationDecision[]>();
  const pendingEntries: DecisionEntry[] = [];
  let analyzedHandCount = 0;

  // Collect decisions, skip cached hands
  for (const hand of hands) {
    const cached = analysisCache.get(hand.id);
    if (cached) {
      analyzedHandCount++;
      continue;
    }
    resultMap.set(hand.id, []);
    pendingEntries.push(...extractHeroDecisions(hand, heroName));
  }

  const uncachedIds = [...resultMap.keys()];
  if (uncachedIds.length === 0) {
    onProgress?.(analyzedHandCount, analyzedHandCount);
    return [...analysisCache.values()].filter((r) => hands.some((h) => h.id === r.handId));
  }

  // Process in batches during idle time
  const toAnalyze = pendingEntries;
  const totalBatches = Math.ceil(toAnalyze.length / BATCH_SIZE);
  let processed = 0;

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    // Yield to idle
    await new Promise<void>((resolve) => requestIdle(() => resolve()));

    const start = batchIdx * BATCH_SIZE;
    const batch = toAnalyze.slice(start, start + BATCH_SIZE);

    const workerResults = await sendToWorker<WorkerAnalyzeResult[]>('batchAnalyze', batch);

    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i]!;
      const wr = workerResults[i];
      const handId = entry.id.split(':')[0]!;
      const deviations = resultMap.get(handId);
      if (!deviations) continue;
      deviations.push(toDecision(entry, wr));
    }

    processed += batch.length;
    // 按已完成决策比例粗粒度上报进度（保守：仅当达到 100% 时精确到手牌数）
    onProgress?.(Math.round((processed / toAnalyze.length) * uncachedIds.length), uncachedIds.length);
  }

  // Build final results, cache, and report progress with unique hand count
  const results: DeviationResult[] = [];
  for (const [handId, deviations] of resultMap) {
    if (deviations.length === 0) continue;
    const result: DeviationResult = {
      handId,
      deviations,
      analyzedAt: Date.now(),
    };
    analysisCache.set(handId, result);
    results.push(result);
  }

  onProgress?.(results.length, results.length);
  return results;
}

/**
 * Get a summary of deviation results for a single hand.
 *
 * 只对 `available === true` 的决策计算最优数 / 平均 EV / 最差决策；
 * 不可用决策只计入 `totalDecisions` 与 `unavailableCount`，不得进入分母，
 * 否则 Worker 失败时会被当成「全部最优、零损失」。
 */
export function getDeviationSummary(result: DeviationResult): DeviationSummary {
  const { deviations } = result;
  const totalDecisions = deviations.length;
  const usable = deviations.filter(d => d.available === true);
  const availableTotal = usable.length;
  const unavailableCount = totalDecisions - availableTotal;

  // P1 fix: 五级体系（best/correct/inaccuracy/wrong/blunder）中最优为 'best'，
  // 'optimal' 是已废弃的三级旧值，导致 optimalCount 恒为 0、最优率永远显示 0%。
  const optimalCount = usable.filter(d => d.grade === 'best').length;
  const averageEvLoss = availableTotal > 0
    ? Math.round((usable.reduce((s, d) => s + d.evLoss, 0) / availableTotal) * 100) / 100
    : 0;

  let worstDecision: { street: string; evLoss: number } | null = null;
  for (const d of usable) {
    if (!worstDecision || d.evLoss > worstDecision.evLoss) {
      worstDecision = { street: d.street, evLoss: d.evLoss };
    }
  }

  return { totalDecisions, availableTotal, unavailableCount, optimalCount, averageEvLoss, worstDecision };
}

/**
 * Get cached deviation for a single hand (synchronous).
 */
export function getCachedDeviation(handId: string): DeviationResult | undefined {
  return analysisCache.get(handId);
}

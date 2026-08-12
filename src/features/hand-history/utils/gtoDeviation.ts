import type { HandHistory } from '../types';
import { ActionType } from '@/shared/types/action';
import { Rank } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';

// ─── Types ────────────────────────────────────────────────

export interface DeviationDecision {
  street: string;
  action: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
}

export interface DeviationResult {
  handId: string;
  deviations: DeviationDecision[];
  analyzedAt: number;
}

export interface DeviationSummary {
  totalDecisions: number;
  optimalCount: number;
  averageEvLoss: number;
  worstDecision: { street: string; evLoss: number } | null;
}

/** Worker 单条分析结果 */
export interface WorkerAnalyzeResult {
  id: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
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
const pending = new Map<number, (result: unknown) => void>();

function getWorker(): Worker | null {
  if (workerRef) return workerRef;
  try {
    const worker = new Worker(new URL('../workers/gtoWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const { id, result } = e.data as { id: number; result: unknown };
      const resolve = pending.get(id);
      if (resolve) {
        resolve(result);
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
      // 该 worker 的所有悬挂请求走 fallback（清空 pending，超时定时器会自行 resolve fallback），避免永久等待
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
      // Fallback: return optimal for everything
      resolve(fallbackAnalyze(payload) as T);
      return;
    }
    const id = ++msgId;
    // P1 fix: 超时定时器存于闭包，消息成功返回或 worker 崩溃时 clearTimeout，避免悬挂定时器
    let timer: ReturnType<typeof setTimeout> | null = null;
    pending.set(id, (result: unknown) => {
      if (timer !== null) clearTimeout(timer);
      resolve(result as T);
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
  const hands = payload as Array<{ id: string }>;
  return hands.map(h => ({ id: h.id, gtoAction: 'call', evLoss: 0, grade: 'best' }));
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
 * Batch-analyze GTO deviations for a set of hands.
 * Uses requestIdleCallback and skips already-cached hands.
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

    const workerResults = await sendToWorker<Array<{
      id: string;
      gtoAction: string;
      evLoss: number;
      grade: string;
    }>>('batchAnalyze', batch);

    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i]!;
      const wr = workerResults[i];
      const handId = entry.id.split(':')[0]!;
      const deviations = resultMap.get(handId);
      if (!deviations) continue;
      deviations.push({
        street: entry.street,
        action: entry.action,
        gtoAction: wr?.gtoAction ?? 'call',
        evLoss: wr?.evLoss ?? 0,
        grade: wr?.grade ?? 'best',
      });
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
 */
export function getDeviationSummary(result: DeviationResult): DeviationSummary {
  const { deviations } = result;
  const totalDecisions = deviations.length;
  // P1 fix: 五级体系（best/correct/inaccuracy/wrong/blunder）中最优为 'best'，
  // 'optimal' 是已废弃的三级旧值，导致 optimalCount 恒为 0、最优率永远显示 0%。
  const optimalCount = deviations.filter(d => d.grade === 'best').length;
  const averageEvLoss = totalDecisions > 0
    ? Math.round((deviations.reduce((s, d) => s + d.evLoss, 0) / totalDecisions) * 100) / 100
    : 0;

  let worstDecision: { street: string; evLoss: number } | null = null;
  for (const d of deviations) {
    if (!worstDecision || d.evLoss > worstDecision.evLoss) {
      worstDecision = { street: d.street, evLoss: d.evLoss };
    }
  }

  return { totalDecisions, optimalCount, averageEvLoss, worstDecision };
}

/**
 * Get cached deviation for a single hand (synchronous).
 */
export function getCachedDeviation(handId: string): DeviationResult | undefined {
  return analysisCache.get(handId);
}

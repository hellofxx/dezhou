/**
 * 训练记录持久化协调器（内存优先 + 可等待结果 + 待重试队列 + 删除/清空防复活）。
 *
 * 分工：
 * - 内存 records 由 progress store 维护（同步、可供 UI 立即读取）；
 * - 本模块只负责「内存 → IndexedDB」这一段：结果可等待、失败可重试、删除/清空不被
 *   在途写入或延迟加载复活、加载屏障可观测。
 *
 * 关键不变量：
 * - `persistRecord` 永不 reject（失败以 `{ ok: false, reason: 'failed' }` 返回并在内存保留），
 *   调用方无需 try/catch；
 * - 失败记录进入 pending 队列（运行态，不持久化），`retryPendingRecords()` 只重写 IDB，
 *   不重新 emit 训练事件、不重新评分 / 不重复计数；
 * - `cancelPendingRecord` / `cancelAllPendingRecords` 会让在途写入的结果变成
 *   `cancelled`，并对已经落库的那次写入做补偿删除，避免删除 / 清空被旧待写任务复活；
 * - `epoch` 供 store.bootstrap 在延迟加载返回时判定「期间是否发生过清空」，旧快照作废；
 *   `removedIds` 供延迟加载过滤「期间被删除」的单条记录。
 */
import type { TrainingRecord } from '@/shared/types/training';
import { recordDatabase } from './utils/recordDatabase';
import {
  classifyPersistenceReason,
  getPersistenceGeneration,
  reportPersistenceFailure,
  reportPersistenceSuccess,
} from './persistenceStatus';

/** 单条记录的持久化结果（跨模块稳定契约，供后续 UI 消费）。 */
export type RecordPersistResult =
  | { ok: true; status: 'inserted' | 'exists' }
  | {
      ok: false;
      reason: 'invalid' | 'cancelled' | 'failed';
      error?: unknown;
      /** true = 记录仍保留在内存（等待重试）；false = 未入账 / 已被删除 */
      retainedInMemory: boolean;
    };

export interface PendingRetrySummary {
  retried: number;
  saved: number;
  failed: number;
}

/** records 自动裁剪阈值（保留最近 N 条） */
const RECORD_LIMIT = 1000;
/** 已删除 id 的墓碑上限，防止长会话无界增长 */
const REMOVED_IDS_LIMIT = 1000;

/** 失败待重试队列（运行态，不持久化） */
const pending = new Map<string, TrainingRecord>();
/** 同 id 在途写入（避免重复落库） */
const inFlight = new Map<string, Promise<RecordPersistResult>>();
/** 本次会话被删除的 id（延迟加载据此过滤，避免删除被复活） */
const removedIds = new Set<string>();

let epoch = 0;
let loading = true;

/** 训练结果是否可入账（纵深防御：空会话 / 缺 result 一律拒收）。 */
export function isPersistableRecord(record: TrainingRecord | null | undefined): boolean {
  return Boolean(record && record.result && record.result.totalQuestions > 0);
}

export function getPendingRecordCount(): number {
  return pending.size;
}

/** 清空 / 删除代次：变化即代表「期间发生过清空」，延迟加载的旧快照必须作废。 */
export function getRecordsEpoch(): number {
  return epoch;
}

/** 记录是否在本次会话被删除（延迟加载据此过滤单条记录）。 */
export function isRecordRemoved(id: string): boolean {
  return removedIds.has(id);
}

/** 初始化屏障：records 恢复（或降级）结束时调用；幂等。 */
export function markRecordsLoadingDone(): void {
  loading = false;
}

/** 初始化屏障：records 是否仍在从 IndexedDB 恢复。 */
export function isRecordsLoading(): boolean {
  return loading;
}

function rememberRemovedId(id: string): void {
  removedIds.add(id);
  if (removedIds.size > REMOVED_IDS_LIMIT) {
    const oldest = removedIds.values().next();
    if (!oldest.done) removedIds.delete(oldest.value);
  }
}

/** 取消某条记录的待写 / 在途写入（删除记录时调用）。 */
export function cancelPendingRecord(id: string): void {
  rememberRemovedId(id);
  pending.delete(id);
}

/** 取消全部待写 / 在途写入（清空记录时调用），并让延迟加载的旧快照作废。 */
export function cancelAllPendingRecords(): void {
  epoch += 1;
  pending.clear();
}

/**
 * 持久化单条记录（内存已由 store 写入，这里只落库）。
 * 结果永不 reject：失败保留在内存并进入 pending 队列等待重试。
 */
export async function persistRecord(record: TrainingRecord): Promise<RecordPersistResult> {
  if (!isPersistableRecord(record)) {
    return { ok: false, reason: 'invalid', retainedInMemory: false };
  }
  const running = inFlight.get(record.id);
  if (running) return running;
  const task = runPersist(record).finally(() => {
    inFlight.delete(record.id);
  });
  inFlight.set(record.id, task);
  return task;
}

async function runPersist(record: TrainingRecord): Promise<RecordPersistResult> {
  const startEpoch = epoch;
  const generation = getPersistenceGeneration('records');
  try {
    const status = await recordDatabase.addIfAbsent(record);
    if (isCancelled(record.id, startEpoch)) {
      if (status === 'inserted') compensateDelete(record.id);
      return { ok: false, reason: 'cancelled', retainedInMemory: false };
    }
    pending.delete(record.id);
    reportPersistenceSuccess('records', { generation, pending: pending.size });
    if (status === 'inserted') void runCleanup();
    return { ok: true, status };
  } catch (error) {
    if (isCancelled(record.id, startEpoch)) {
      return { ok: false, reason: 'cancelled', retainedInMemory: false };
    }
    pending.set(record.id, record);
    reportPersistenceFailure('records', {
      reason: classifyPersistenceReason(error),
      operation: 'add',
      pending: pending.size,
    });
    return { ok: false, reason: 'failed', error, retainedInMemory: true };
  }
}

function isCancelled(id: string, startEpoch: number): boolean {
  return startEpoch !== epoch || removedIds.has(id);
}

/** 写入在取消之后才落库：补偿删除，避免删除 / 清空被复活。 */
function compensateDelete(id: string): void {
  void recordDatabase.delete(id).catch((error: unknown) => {
    console.warn('[progress] 补偿删除训练记录失败', error);
  });
}

async function runCleanup(): Promise<void> {
  const generation = getPersistenceGeneration('cleanup');
  try {
    await recordDatabase.cleanup(RECORD_LIMIT);
    reportPersistenceSuccess('cleanup', { generation });
  } catch (error) {
    // cleanup 失败只标记 cleanup 来源，绝不清除 records 来源的失败态
    reportPersistenceFailure('cleanup', {
      reason: classifyPersistenceReason(error),
      operation: 'cleanup',
    });
  }
}

/**
 * 重试全部待写记录（只重写 IDB，不重新 emit 训练事件 / 不重新评分）。
 * @returns 尝试条数 / 成功条数 / 失败条数
 */
export async function retryPendingRecords(): Promise<PendingRetrySummary> {
  const queued = [...pending.values()].filter((record) => !removedIds.has(record.id));
  let saved = 0;
  let failed = 0;
  for (const record of queued) {
    const result = await persistRecord(record);
    if (result.ok) saved += 1;
    else if (result.reason !== 'cancelled') failed += 1;
  }
  return { retried: queued.length, saved, failed };
}

/** 删除单条记录时的持久化侧处理：取消在途 / 待写任务（防复活）后再删库。 */
export function removePersistedRecord(id: string): void {
  cancelPendingRecord(id);
  void recordDatabase.delete(id).catch((error: unknown) => {
    console.warn('[progress] 删除训练记录失败', error);
    reportPersistenceFailure('records', {
      reason: classifyPersistenceReason(error),
      operation: 'delete',
      pending: pending.size,
    });
  });
}

/**
 * 清空记录时的持久化侧处理：推进代次 + 取消待写任务（延迟加载不复活），再清库。
 * 清库失败不假装成功：先回调 onFailure 让调用方回滚内存，再上报 records 来源失败。
 */
export function clearPersistedRecords(onFailure: () => void): void {
  cancelAllPendingRecords();
  const generation = getPersistenceGeneration('records');
  void recordDatabase.clear().then(
    () => reportPersistenceSuccess('records', { generation, pending: pending.size }),
    (error: unknown) => {
      console.warn('[progress] 清空训练记录失败', error);
      onFailure();
      reportPersistenceFailure('records', {
        reason: classifyPersistenceReason(error),
        operation: 'clear',
        pending: pending.size,
      });
    },
  );
}

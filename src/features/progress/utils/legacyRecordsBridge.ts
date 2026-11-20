/**
 * 遗留 records 桥接（v13 起 partialize 排除 records 的升级首启保护）。
 *
 * 问题：升级首启时旧 persist 载荷里仍有 records，但 Zustand hydrate 在迁移完成后
 * 会立刻 setItem 写回「partialize 结果」——不含 records。若此时 IndexedDB 迁入
 * 尚未开始 / 已失败，旧 records 就被永久擦除（localStorage 与 IDB 两头皆空）。
 *
 * 方案（不升 persist version、不清库、不加 localStorage 备份键）：
 * 1. persistStorage.getItem 读到原始字符串后 `captureLegacyRecords` 把 records
 *    暂存到内存（本模块是唯一持有者，进程退出即丢弃，绝不写回 localStorage 新键）；
 * 2. persistStorage.setItem 序列化前 `preserveLegacyRecordsInPayload` 把旧 records
 *    合并回即将写入的 state.records（只补旧记录，不同 id 才追加；同 id 以已存在为准）；
 * 3. store.bootstrap 在 hydration 后经 recordPersistence 幂等迁入 IndexedDB，
 *    确认成功后才 `removeLegacyRecordsFromStorage`：从原 key 载荷中摘掉 records 并
 *    写回，然后释放桥接；写回失败则保持桥接激活并上报 records 来源，下次 init 重试。
 *
 * 边界：本模块只做载荷搬运，不新增业务动作；JSON 解析失败 / 非对象载荷一律安全
 * 跳过（不抛异常、不记录正文）。
 */
import type { TrainingRecord } from '@/shared/types/training';
import {
  classifyPersistenceReason,
  reportPersistenceFailure,
  reportPersistenceSuccess,
} from '../persistenceStatus';

/** progress persist 的 localStorage key（与 store.ts persist 配置的 name 一致）。 */
export const LEGACY_RECORDS_STORAGE_KEY = 'poker-training-progress';

interface BridgeState {
  active: boolean;
  records: TrainingRecord[];
  storageKey: string;
  /** 本次桥接自己上报的失败代次（成功清理时按代次回执，不误清他人的失败态） */
  failureGeneration: number | null;
}

const bridge: BridgeState = {
  active: false,
  records: [],
  storageKey: LEGACY_RECORDS_STORAGE_KEY,
  failureGeneration: null,
};

type UnknownRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 只接受可持久化的最小形状（对象 + 非空 id + 数值 createdAt），其余静默丢弃。 */
function normalizeRecords(value: unknown): TrainingRecord[] {
  if (!Array.isArray(value)) return [];
  const result: TrainingRecord[] = [];
  for (const entry of value) {
    if (!isPlainObject(entry)) continue;
    const id = entry.id;
    const createdAt = entry.createdAt;
    if (typeof id !== 'string' || id.length === 0) continue;
    if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) continue;
    result.push(entry as unknown as TrainingRecord);
  }
  return result;
}

function parsePayload(rawJson: string): UnknownRecord | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    // 载荷损坏：安全跳过，不记录正文
    return null;
  }
}

function readRaw(key: string): { ok: true; value: string | null } | { ok: false } {
  if (typeof window === 'undefined' || !window.localStorage) return { ok: true, value: null };
  try {
    return { ok: true, value: window.localStorage.getItem(key) };
  } catch (error) {
    reportLegacyFailure('legacy-read', error);
    return { ok: false };
  }
}

function writeRaw(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    reportLegacyFailure('legacy-cleanup', error);
    return false;
  }
}

function reportLegacyFailure(operation: string, error: unknown): void {
  bridge.failureGeneration = reportPersistenceFailure('records', {
    reason: classifyPersistenceReason(error),
    operation,
  });
}

function reportLegacyCleanupSuccess(): void {
  if (bridge.failureGeneration === null) return;
  reportPersistenceSuccess('records', { generation: bridge.failureGeneration });
  bridge.failureGeneration = null;
}

/**
 * 从 persist 原始载荷中提取非空 records 暂存到内存（幂等：重复捕获按 id 合并）。
 * 解析失败 / 无 records / records 为空时保持当前桥接状态不变。
 */
export function captureLegacyRecords(
  rawJson: string | null,
  storageKey: string = LEGACY_RECORDS_STORAGE_KEY,
): void {
  if (typeof rawJson !== 'string' || rawJson.length === 0) return;
  const payload = parsePayload(rawJson);
  if (!payload) return;
  const state = payload.state;
  if (!isPlainObject(state)) return;
  const incoming = normalizeRecords(state.records);
  if (incoming.length === 0) return;

  const merged = new Map(bridge.records.map((record) => [record.id, record]));
  for (const record of incoming) {
    if (!merged.has(record.id)) merged.set(record.id, record);
  }
  bridge.records = [...merged.values()];
  bridge.active = true;
  bridge.storageKey = storageKey;
}

/** 桥接是否仍处于激活态（= 旧 records 尚未从 localStorage 摘除）。 */
export function isLegacyBridgeActive(): boolean {
  return bridge.active;
}

/** 当前暂存的旧 records（运行时副本，调用方不得原地修改）。 */
export function getLegacyRecords(): TrainingRecord[] {
  return bridge.records;
}

/** 释放桥接（迁入并清理成功后调用；测试也用它复位）。 */
export function releaseLegacyBridge(): void {
  bridge.active = false;
  bridge.records = [];
  bridge.failureGeneration = null;
}

function recordsOf(state: UnknownRecord): unknown[] {
  return Array.isArray(state.records) ? state.records : [];
}

function idOf(entry: unknown): string | null {
  if (!isPlainObject(entry)) return null;
  return typeof entry.id === 'string' && entry.id.length > 0 ? entry.id : null;
}

function createdAtOf(entry: unknown): number {
  if (!isPlainObject(entry)) return 0;
  const createdAt = entry.createdAt;
  return typeof createdAt === 'number' && Number.isFinite(createdAt) ? createdAt : 0;
}

/**
 * 写回保护：桥接未完成时把暂存的旧 records 合并回即将写入的 state.records。
 * - 不加入新训练（只补捕获到的旧记录）；
 * - 不覆盖已有记录（同 id 以载荷中已存在者为准）；
 * - 载荷非对象 / 无 state 时原样返回。
 */
export function preserveLegacyRecordsInPayload(payload: unknown): unknown {
  if (!bridge.active || bridge.records.length === 0) return payload;
  if (!isPlainObject(payload)) return payload;
  const state = payload.state;
  if (!isPlainObject(state)) return payload;

  const existing = recordsOf(state);
  const existingIds = new Set(existing.map(idOf).filter((id): id is string => id !== null));
  const additions = bridge.records.filter((record) => !existingIds.has(record.id));
  if (additions.length === 0) return payload;

  const records = [...existing, ...additions].toSorted(
    (a, b) => createdAtOf(a) - createdAtOf(b),
  );
  return { ...payload, state: { ...state, records } };
}

/**
 * 迁入 IndexedDB 并确认成功后，从原 key 的持久化载荷中移除 records 并写回。
 * @returns true = 载荷已清理且桥接释放；false = 写回 / 读取失败，桥接保持激活（可下次重试）
 */
export function removeLegacyRecordsFromStorage(): boolean {
  if (!bridge.active) return true;
  const read = readRaw(bridge.storageKey);
  if (!read.ok) return false;
  if (read.value === null) {
    // 原载荷已不存在（被其他途径清掉）：无需清理
    releaseLegacyBridge();
    return true;
  }

  const payload = parsePayload(read.value);
  if (!payload) {
    reportLegacyFailure('legacy-cleanup', new Error('persist payload unparsable'));
    return false;
  }
  const state = payload.state;
  if (!isPlainObject(state) || !('records' in state)) {
    releaseLegacyBridge();
    return true;
  }

  const remainingState: UnknownRecord = { ...state };
  delete remainingState.records;
  const nextPayload = JSON.stringify({ ...payload, state: remainingState });
  if (!writeRaw(bridge.storageKey, nextPayload)) return false;

  reportLegacyCleanupSuccess();
  releaseLegacyBridge();
  return true;
}

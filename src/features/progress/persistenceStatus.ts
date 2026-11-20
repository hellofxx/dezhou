/**
 * 持久化失败运行态（不进 persist、不进 localStorage）。
 *
 * 背景：原实现把 localStorage 写失败标记 `persistError` 塞进 progress store，
 * 与业务状态混在一起，且只有 localStorage 一个来源——IndexedDB records 写入 /
 * 裁剪失败、清空失败都只能 console.warn，用户不可见。
 *
 * 本模块把「持久化健康度」抽成独立的外部 store（useSyncExternalStore），按来源分治：
 * - `localStorage`：persist 快照写失败（persistStorage 上报）
 * - `records`：训练记录写入 / 删除 / 清空 / 加载失败（recordPersistence 与 store 上报）
 * - `cleanup`：记录裁剪（cleanup）失败，与 records 互不覆盖
 *
 * 代次（generation）语义：
 * - 每次失败让该来源的代次 +1，并记录 `at`；
 * - 成功只清「自己的来源」，且可携带操作开始时的代次——代次已变（期间发生过新失败）
 *   则不清，避免迟到的成功把更新的失败抹掉；
 * - 一次成功写入后同源失败可以再次通知（不再永久去重）。
 *
 * persistenceStatus 不反向 import progress store：localStorage 重试动作由 store 注册
 * （见 store.ts 底部 setLocalStorageRetryHandler），避免循环依赖。
 */
import { useSyncExternalStore } from 'react';

export type PersistenceSource = 'localStorage' | 'records' | 'cleanup';

export type PersistenceFailureReason = 'quota' | 'unavailable' | 'unknown';

export interface PersistenceSourceStatus {
  readonly active: boolean;
  readonly reason?: PersistenceFailureReason;
  readonly operation?: string;
  readonly at?: number;
  /** 仅 records 来源使用：待重试写入的记录条数 */
  readonly pending?: number;
}

export interface PersistenceStatus {
  readonly localStorage: PersistenceSourceStatus;
  readonly records: PersistenceSourceStatus;
  readonly cleanup: PersistenceSourceStatus;
}

const INACTIVE: PersistenceSourceStatus = Object.freeze({ active: false });

let status: PersistenceStatus = Object.freeze({
  localStorage: INACTIVE,
  records: INACTIVE,
  cleanup: INACTIVE,
});

const generations: Record<PersistenceSource, number> = {
  localStorage: 0,
  records: 0,
  cleanup: 0,
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of [...listeners]) listener();
}

function setSource(source: PersistenceSource, next: PersistenceSourceStatus): void {
  status = Object.freeze({ ...status, [source]: next });
  notify();
}

/** 把持久化层抛出的错误归类（quota / unavailable / unknown）。 */
export function classifyPersistenceReason(error: unknown): PersistenceFailureReason {
  const name = error instanceof Error ? error.name : '';
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    message.includes('quota')
  ) {
    return 'quota';
  }
  if (
    name === 'SecurityError' ||
    name === 'NotAllowedError' ||
    name === 'InvalidStateError' ||
    name === 'InvalidAccessError' ||
    message.includes('insecure') ||
    message.includes('denied') ||
    message.includes('unavailable') ||
    message.includes('blocked')
  ) {
    return 'unavailable';
  }
  return 'unknown';
}

export function subscribePersistenceStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 当前快照（引用稳定：内容不变时不产生新对象，供 useSyncExternalStore 使用）。 */
export function getPersistenceStatus(): PersistenceStatus {
  return status;
}

/** 组件侧读取入口（后续 UI 切片消费）。 */
export function usePersistenceStatus(): PersistenceStatus {
  return useSyncExternalStore(
    subscribePersistenceStatus,
    getPersistenceStatus,
    getPersistenceStatus,
  );
}

export function getPersistenceGeneration(source: PersistenceSource): number {
  return generations[source];
}

/**
 * 上报一次失败：代次 +1 并置为 active，可重复通知（每次失败都通知订阅者）。
 * @returns 本次失败的代次，供后续成功回传做「只清对应代次」判定
 */
export function reportPersistenceFailure(
  source: PersistenceSource,
  detail: {
    reason: PersistenceFailureReason;
    operation?: string;
    pending?: number;
  },
): number {
  generations[source] += 1;
  const next: PersistenceSourceStatus = {
    active: true,
    reason: detail.reason,
    at: Date.now(),
    ...(detail.operation === undefined ? {} : { operation: detail.operation }),
    ...(detail.pending === undefined ? {} : { pending: detail.pending }),
  };
  setSource(source, Object.freeze(next));
  return generations[source];
}

/**
 * 上报一次成功：
 * - `pending > 0`：仍有待写记录，保留该来源的失败态，只更新待重试计数；
 * - 携带 `generation` 且与当前代次不符：期间有更新的失败，不清（迟到的成功不抹新失败）；
 * - 否则只清该来源（不影响其他来源的失败态）。
 */
export function reportPersistenceSuccess(
  source: PersistenceSource,
  options: { generation?: number; pending?: number } = {},
): void {
  const pending = options.pending ?? 0;
  const current = status[source];
  if (pending > 0) {
    if (current.active && current.pending !== pending) {
      setSource(source, Object.freeze({ ...current, pending }));
    }
    return;
  }
  if (options.generation !== undefined && options.generation !== generations[source]) return;
  if (!current.active) return;
  setSource(source, INACTIVE);
}

/** 手动清除某个来源的失败态（用户确认 / UI 关闭提示）。 */
export function clearPersistenceFailure(source: PersistenceSource): void {
  if (!status[source].active) return;
  setSource(source, INACTIVE);
}

let localStorageRetryHandler: (() => boolean) | null = null;

/**
 * 注册 localStorage 重试动作（由 progress store 注入，避免本模块 import store 成环）。
 * handler 内部用 `setState((state) => state)` 触发一次规范快照写入。
 */
export function setLocalStorageRetryHandler(handler: (() => boolean) | null): void {
  localStorageRetryHandler = handler;
}

/** 触发一次快照重写；未注册 handler 时返回 false（无可重试动作）。 */
export function retryLocalStorageWrite(): boolean {
  if (!localStorageRetryHandler) return false;
  return localStorageRetryHandler();
}

/** 仅测试使用：复位运行态。 */
export function __resetPersistenceStatus(): void {
  status = Object.freeze({ localStorage: INACTIVE, records: INACTIVE, cleanup: INACTIVE });
  generations.localStorage = 0;
  generations.records = 0;
  generations.cleanup = 0;
  localStorageRetryHandler = null;
}

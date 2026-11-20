/**
 * 安全的 persist storage 包装层。
 *
 * Zustand persist 中间件持久化到 localStorage 时，setItem 在配额打满
 * 时同步抛 QuotaExceededError，而 action 包装会先更新内存再调 setItem，
 * 导致内存已更新、UI 正常，但数据实际没落盘——用户下次刷新才发现进度回退。
 *
 * 本工具包裹 window.localStorage，捕获写失败并按原因分类上报，
 * 同时阻断异常向外传播（避免破坏 action 事务），使系统在存储不可用时
 * 至少保持内存状态的一致性。失败态由 persistenceStatus 的 localStorage 来源承载
 * （接线在 progress store 底部），不再写进 persist 快照。
 *
 * 通知语义：
 * - 同一次「持续故障」内同一 reason 只通知一次（避免刷屏）；
 * - 一旦有一次成功写入即视为恢复：复位去重表并通知成功回调，
 *   之后的同类失败可以再次通知（可重复通知）。
 *
 * 遗留 records 桥接（v13 起 partialize 排除 records）：
 * - getItem 读到原始字符串后交给 legacyRecordsBridge 暂存旧 records；
 * - setItem 在序列化前把暂存记录合并回即将写入的 state.records，
 *   避免「hydrate 迁移写回」在 IndexedDB 迁入完成前擦掉旧 records；
 * - removeItem 不参与桥接（清理语义由调用方负责）。
 * 详见 utils/legacyRecordsBridge.ts。
 *
 * 裸调 localStorage 的仓库规则禁止"业务代码直接调用 localStorage"，
 * 本工具正是持久化层本身，属于允许位置。
 */
import {
  createJSONStorage,
  type PersistStorage,
  type StorageValue,
} from 'zustand/middleware';
import { classifyPersistenceReason } from '../persistenceStatus';
import { captureLegacyRecords, preserveLegacyRecordsInPayload } from './legacyRecordsBridge';

// ===== 失败分类 =====

export interface PersistFailure {
  reason: 'quota' | 'unavailable' | 'unknown';
  at: number;
  error: Error;
}

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

// ===== 通知机制 =====

let failureHandler: ((f: PersistFailure) => void) | null = null;
let successHandler: (() => void) | null = null;

/** 注册 persist 写失败回调（模块级单回调，不要引入新的事件总线）。 */
export function setPersistFailureHandler(
  cb: ((f: PersistFailure) => void) | null,
): void {
  failureHandler = cb;
}

/** 注册 persist 写成功回调（用于清除 localStorage 来源的失败态）。 */
export function setPersistSuccessHandler(cb: (() => void) | null): void {
  successHandler = cb;
}

/** 模块级去重：持续故障期间同一 reason 只通知一次（成功写入后复位）。 */
const notifiedReasons = new Set<string>();

/** 重置去重表（仅用于测试）。 */
export function __resetPersistFailureDedup(): void {
  notifiedReasons.clear();
}

function notifyFailure(failure: PersistFailure): void {
  if (notifiedReasons.has(failure.reason)) return;
  notifiedReasons.add(failure.reason);
  failureHandler?.(failure);
}

function notifySuccess(): void {
  // 一次成功写入即证明存储恢复：复位去重表，后续同类失败可再次通知
  notifiedReasons.clear();
  successHandler?.();
}

function reportFailure(err: unknown, forceUnavailable = false): void {
  const reason = forceUnavailable ? 'unavailable' : classifyPersistenceReason(err);
  notifyFailure({ reason, at: Date.now(), error: toError(err) });
}

// ===== 安全 Storage 实现 =====

/**
 * 创建带 try/catch 的字符串型 StateStorage，包裹 window.localStorage。
 * SSR 安全：typeof window === 'undefined' 时返回 no-op 对象。
 */
function createSafeStorage(): SyncStateStorage {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  const raw = window.localStorage;

  return {
    getItem(name: string): string | null {
      try {
        return raw.getItem(name);
      } catch (err) {
        reportFailure(err, true);
        // 读失败返回 null（消失的 localStorage 比崩溃强）
        return null;
      }
    },

    setItem(name: string, value: string): void {
      try {
        raw.setItem(name, value);
        notifySuccess();
      } catch (err) {
        reportFailure(err);
        // 不向外抛异常：内存态已更新，UI 可见；写失败经通知机制上报
      }
    },

    removeItem(name: string): void {
      try {
        raw.removeItem(name);
      } catch (err) {
        reportFailure(err, true);
      }
    },
  };
}

/** 同步实现；与 StateStorage 兼容，但类型收敛以便桥接直接读取原始字符串。 */
interface SyncStateStorage {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
  removeItem(name: string): void;
}

/** 惰性初始化：首次访问才创建 safeStorage 实例。 */
let cachedStorage: SyncStateStorage | null = null;
function getSafeStorage(): SyncStateStorage {
  if (!cachedStorage) {
    cachedStorage = createSafeStorage();
  }
  return cachedStorage;
}

/** 读原始字符串（桥接捕获用；错误已由 safeStorage 归类上报）。 */
function readRawString(name: string): string | null {
  const value = getSafeStorage().getItem(name);
  // safeStorage 为同步实现；StateStorage 类型允许异步，这里只接受同步字符串
  return typeof value === 'string' ? value : null;
}

/** createJSONStorage 结果（对象 ↔ 字符串）；桥接逻辑包在它外层。 */
const jsonStorage = createJSONStorage<unknown>(() => getSafeStorage());

/**
 * 供 progress store persist 使用的 storage 实例。
 * 类型为 zustand 的 PersistStorage（经 createJSONStorage 包装）。
 * createJSONStorage 在 getStorage 返回 falsy 时可能返回 undefined，
 * store 侧接入时用 `?? undefined` 让 persist 走内置默认。
 */
export const progressPersistStorage: PersistStorage<unknown> | undefined = jsonStorage
  ? {
      getItem(name: string) {
        // 必须在 Zustand 解析 / 迁移写回之前捕获旧 records
        captureLegacyRecords(readRawString(name), name);
        return jsonStorage.getItem(name);
      },
      setItem(name: string, value: StorageValue<unknown>) {
        return jsonStorage.setItem(
          name,
          preserveLegacyRecordsInPayload(value) as StorageValue<unknown>,
        );
      },
      removeItem(name: string) {
        return jsonStorage.removeItem(name);
      },
    }
  : undefined;

/**
 * 安全的 persist storage 包装层。
 *
 * Zustand persist 中间件持久化到 localStorage 时，setItem 在配额打满
 * 时同步抛 QuotaExceededError，而 action 包装会先更新内存再调 setItem，
 * 导致内存已更新、UI 正常，但数据实际没落盘——用户下次刷新才发现进度回退。
 *
 * 本工具包裹 window.localStorage，捕获写失败并按原因分类上报，
 * 同时阻断异常向外传播（避免破坏 action 事务），使系统在存储不可用时
 * 至少保持内存状态的一致性，并由 PersistErrorNotice 组件提示用户。
 *
 * 裸调 localStorage 的仓库规则禁止"业务代码直接调用 localStorage"，
 * 本工具正是持久化层本身，属于允许位置。
 */
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// ===== 失败分类 =====

export interface PersistFailure {
  reason: 'quota' | 'unavailable' | 'unknown';
  at: number;
  error: Error;
}

/**
 * 将 localStorage 抛出的错误分类。
 * - quota：QuotaExceededError / NS_ERROR_DOM_QUOTA_REACHED / message 含 quota
 * - unknown：其他错误
 * （unavailable 在 getItem/setItem/removeItem 捕获到读取 localStorage 本身抛错时归类）
 */
function classifyPersistError(err: unknown): PersistFailure['reason'] {
  const error = err instanceof Error ? err : new Error(String(err));
  const name = error.name;
  const message = error.message?.toLowerCase() ?? '';
  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    message.includes('quota')
  ) {
    return 'quota';
  }
  return 'unknown';
}

// ===== 通知机制 =====

let failureHandler: ((f: PersistFailure) => void) | null = null;

/** 注册 persist 写失败回调（模块级单回调，不要引入新的事件总线）。 */
export function setPersistFailureHandler(
  cb: ((f: PersistFailure) => void) | null,
): void {
  failureHandler = cb;
}

/** 模块级去重：同一 reason 在全会话内只通知一次。 */
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

// ===== 安全 Storage 实现 =====

/**
 * 创建带 try/catch 的字符串型 StateStorage，包裹 window.localStorage。
 * SSR 安全：typeof window === 'undefined' 时返回 no-op 对象。
 */
function createSafeStorage(): StateStorage {
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
        notifyFailure({
          reason: 'unavailable',
          at: Date.now(),
          error: err instanceof Error ? err : new Error(String(err)),
        });
        // 读失败返回 null（消失的 localStorage 比崩溃强）
        return null;
      }
    },

    setItem(name: string, value: string): void {
      try {
        raw.setItem(name, value);
      } catch (err) {
        const reason = classifyPersistError(err);
        notifyFailure({ reason, at: Date.now(), error: err instanceof Error ? err : new Error(String(err)) });
        // 不向外抛异常：内存态已更新，UI 可见；写失败经通知机制上报
      }
    },

    removeItem(name: string): void {
      try {
        raw.removeItem(name);
      } catch (err) {
        notifyFailure({
          reason: 'unavailable',
          at: Date.now(),
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    },
  };
}

/** 惰性初始化：首次访问才创建 safeStorage 实例。 */
let cachedStorage: StateStorage | null = null;
function getSafeStorage(): StateStorage {
  if (!cachedStorage) {
    cachedStorage = createSafeStorage();
  }
  return cachedStorage;
}

/**
 * 供 progress store persist 使用的 storage 实例。
 * 类型为 zustand 的 PersistStorage（经 createJSONStorage 包装）。
 * createJSONStorage 在 getStorage 返回 falsy 时可能返回 undefined，
 * store 侧接入时用 `?? undefined` 让 persist 走内置默认。
 */
export const progressPersistStorage = createJSONStorage(() => getSafeStorage());
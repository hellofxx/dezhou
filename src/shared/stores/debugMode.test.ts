/**
 * debugMode store 行为契约（调试解锁，全局 9 处门禁的旁路开关）：
 * - 激活码唯一事实源为 DEBUG_UNLOCK_CODE（本测试从常量取码，不复制数值）
 * - 激活码前后空白容忍；错误码返回 false 且不改状态
 * - deactivate 关闭解锁；isDebugUnlockActive() 是非响应式读取入口
 * - persist：解锁状态写入 localStorage（刷新后仍生效）
 *
 * 注意：zustand persist 在 store 创建时即固定 storage 引用，
 * 故整个文件共用一个 localStorage 桩，逐用例 clear 而不是逐用例换桩。
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, type LocalStorageStub } from '@/shared/utils/localStorageStub';

const STORAGE_KEY = 'poker-debug-mode';

let storage: LocalStorageStub;
let store: typeof import('./debugMode');

const persistedUnlockAll = (): unknown => {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw).state.unlockAll;
};

describe('debugMode store', () => {
  beforeAll(async () => {
    storage = createLocalStorageStub();
    vi.stubGlobal('localStorage', storage);
    vi.stubGlobal('window', { localStorage: storage });
    store = await import('./debugMode');
  });

  beforeEach(() => {
    store.useDebugModeStore.setState({ unlockAll: false });
    storage.clear();
  });

  it('初始为未解锁', () => {
    expect(store.useDebugModeStore.getState().unlockAll).toBe(false);
    expect(store.isDebugUnlockActive()).toBe(false);
  });

  it('正确激活码返回 true 并置 unlockAll，同时写入持久化存储', () => {
    const ok = store.useDebugModeStore.getState().activateWithCode(store.DEBUG_UNLOCK_CODE);

    expect(ok).toBe(true);
    expect(store.useDebugModeStore.getState().unlockAll).toBe(true);
    expect(store.isDebugUnlockActive()).toBe(true);
    expect(persistedUnlockAll()).toBe(true);
  });

  it('激活码前后空白被容忍（移动端粘贴常带空格）', () => {
    const ok = store.useDebugModeStore.getState().activateWithCode(`  ${store.DEBUG_UNLOCK_CODE}  `);
    expect(ok).toBe(true);
    expect(store.useDebugModeStore.getState().unlockAll).toBe(true);
  });

  it('错误激活码返回 false 且不改变状态', () => {
    const ok = store.useDebugModeStore.getState().activateWithCode(`${store.DEBUG_UNLOCK_CODE}0`);

    expect(ok).toBe(false);
    expect(store.useDebugModeStore.getState().unlockAll).toBe(false);
    // 状态未变即不产生持久化写入（beforeEach 已清空存储）
    expect(persistedUnlockAll()).toBeNull();
  });

  it('deactivate 关闭解锁并可再次激活（状态可逆）', () => {
    const { activateWithCode, deactivate } = store.useDebugModeStore.getState();
    activateWithCode(store.DEBUG_UNLOCK_CODE);
    deactivate();
    expect(store.isDebugUnlockActive()).toBe(false);
    expect(persistedUnlockAll()).toBe(false);

    store.useDebugModeStore.getState().activateWithCode(store.DEBUG_UNLOCK_CODE);
    expect(store.isDebugUnlockActive()).toBe(true);
  });

  it('持久化 name 与 version 固定（形状变更须递增 version + migrate）', () => {
    expect(store.useDebugModeStore.persist.getOptions().name).toBe(STORAGE_KEY);
    expect(store.useDebugModeStore.persist.getOptions().version).toBe(1);
  });
});

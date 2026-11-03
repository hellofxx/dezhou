import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { buildPersistedShape } from '@/shared/utils/persistShape';

/**
 * debugMode store 持久化形状快照测试。
 *
 * 锁定 persist 实际写入 localStorage 的键结构。持久化字段一旦新增 / 删除 / 类型变更，
 * 快照即失配、测试变红，强制作者面对「递增 version + 编写 migrate」的决策。
 *
 * ⚠️ 快照失配时禁止盲目 `vitest -u`：先判断 schema 是否真的变化；
 *    若变化，递增 persist version 并编写 migrate（防御性合并默认值）后再更新快照。
 */
describe('debugMode store persisted shape', () => {
  it('持久化键结构与当前快照一致（变化即需 bump version + migrate）', async () => {
    const storageStub = createLocalStorageStub();
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useDebugModeStore } = await import('./debugMode');
    const { partialize } = useDebugModeStore.persist.getOptions();
    const state = useDebugModeStore.getState();
    const persisted = partialize ? partialize(state) : state;

    expect(buildPersistedShape(persisted)).toMatchInlineSnapshot(`
      {
        "unlockAll": "boolean",
      }
    `);
  });
});

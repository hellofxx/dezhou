import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { buildPersistedShape } from '@/shared/utils/persistShape';

/**
 * theory-academy store 持久化形状快照测试。
 *
 * 锁定 persist 实际写入 localStorage 的键结构（partialize 后经 JSON 序列化）。
 * 持久化字段一旦新增 / 删除 / 类型变更，快照即失配、测试变红，
 * 强制作者面对「递增 version + 编写 migrate」的决策，避免漏迁移静默产出半新半旧数据。
 *
 * ⚠️ 快照失配时禁止盲目 `vitest -u`：请先在 store 中递增 persist version 并编写
 *    migrate（防御性合并默认值），再更新本快照（见 AGENTS.md「Persist Version 升级硬性规则」）。
 */
describe('theory-academy store persisted shape', () => {
  it('持久化键结构与当前快照一致（变化即需 bump version + migrate）', async () => {
    const storageStub = createLocalStorageStub();
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useTheoryStore } = await import('./store');
    const { partialize } = useTheoryStore.persist.getOptions();
    const state = useTheoryStore.getState();
    const persisted = partialize ? partialize(state) : state;

    expect(buildPersistedShape(persisted)).toMatchInlineSnapshot(`
      {
        "progress": {
          "activeVariant": "string",
          "completedChapters": "array",
          "currentChapter": "null",
          "flaggedQuestions": "array",
          "quizScores": {},
          "startedAt": "number",
          "variantMetadata": {
            "heads-up": {
              "lastViewedAt": "number",
              "preferredOrder": "number",
            },
            "short-deck": {
              "lastViewedAt": "number",
              "preferredOrder": "number",
            },
            "standard": {
              "lastViewedAt": "number",
              "preferredOrder": "number",
            },
          },
        },
      }
    `);
  });
});

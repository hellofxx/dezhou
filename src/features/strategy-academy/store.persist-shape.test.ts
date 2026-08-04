import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { buildPersistedShape } from '@/shared/utils/persistShape';

/**
 * strategy-academy store 持久化形状快照测试。
 *
 * 锁定 persist 实际写入 localStorage 的键结构（partialize 后经 JSON 序列化）。
 * 持久化字段一旦新增 / 删除 / 类型变更，快照即失配、测试变红，
 * 强制作者面对「递增 version + 编写 migrate」的决策，避免漏迁移静默产出半新半旧数据。
 *
 * ⚠️ 快照失配时禁止盲目 `vitest -u`：请先在 store 中递增 persist version 并编写
 *    migrate（防御性合并默认值），再更新本快照（见 AGENTS.md「Persist Version 升级硬性规则」）。
 */
describe('strategy-academy store persisted shape', () => {
  it('持久化键结构与当前快照一致（变化即需 bump version + migrate）', async () => {
    const storageStub = createLocalStorageStub();
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useAcademyStore } = await import('./store');
    const { partialize } = useAcademyStore.persist.getOptions();
    const state = useAcademyStore.getState();
    const persisted = partialize ? partialize(state) : state;

    expect(buildPersistedShape(persisted)).toMatchInlineSnapshot(`
      {
        "abilityAssessment": {
          "emotionalControl": "number",
          "gtoUnderstanding": "number",
          "lastUpdated": "number",
          "oddsCalculation": "number",
          "positionalPlay": "number",
          "rangeKnowledge": "number",
        },
        "activeTrackId": "null",
        "adaptiveConfig": {
          "downgradeThreshold": "number",
          "enabled": "boolean",
          "recentWindow": "number",
          "timeBonus": "number",
          "upgradeThreshold": "number",
        },
        "basicsProgress": {
          "completed": "boolean",
          "currentStep": "number",
        },
        "certifications": {},
        "dailyPlan": "null",
        "firstAttemptScores": {},
        "lastAttemptScores": {},
        "practiceResults": "array",
        "progress": {
          "completedLessons": "array",
          "completedUnits": {},
          "currentLesson": "null",
          "quizScores": {},
          "startedAt": "number",
        },
        "recentPracticeResults": "array",
      }
    `);
  });
});

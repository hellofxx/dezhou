import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { buildPersistedShape } from '@/shared/utils/persistShape';

/**
 * progress store 持久化形状快照测试。
 *
 * 锁定 persist 实际写入 localStorage 的键结构（partialize 后经 JSON 序列化）。
 * 持久化字段一旦新增 / 删除 / 类型变更，快照即失配、测试变红，
 * 强制作者面对「递增 version + 编写 migrate」的决策，避免漏迁移静默产出半新半旧数据。
 *
 * ⚠️ 快照失配时禁止盲目 `vitest -u`：请先在 store 中递增 persist version 并编写
 *    migrate（防御性合并默认值），再更新本快照（见 AGENTS.md「Persist Version 升级硬性规则」）。
 */
describe('progress store persisted shape', () => {
  it('持久化键结构与当前快照一致（变化即需 bump version + migrate）', async () => {
    const storageStub = createLocalStorageStub();
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const { partialize } = useProgressStore.persist.getOptions();
    const state = useProgressStore.getState();
    const persisted = partialize ? partialize(state) : state;

    expect(buildPersistedShape(persisted)).toMatchInlineSnapshot(`
      {
        "achievementUnlockDates": {},
        "activeVariant": "string",
        "currentGameVariant": "string",
        "dismissedRecommendations": "array",
        "elo": {
          "gamesPlayed": "number",
          "handReading": "number",
          "kFactor": "number",
          "lastUpdated": "number",
          "math": "number",
          "mental": "number",
          "overall": "number",
          "postflop": "number",
          "preflop": "number",
        },
        "eloByVariant": {
          "heads-up": {
            "gamesPlayed": "number",
            "handReading": "number",
            "kFactor": "number",
            "lastUpdated": "number",
            "math": "number",
            "mental": "number",
            "overall": "number",
            "postflop": "number",
            "preflop": "number",
            "variant": "string",
          },
          "short-deck": {
            "gamesPlayed": "number",
            "handReading": "number",
            "kFactor": "number",
            "lastUpdated": "number",
            "math": "number",
            "mental": "number",
            "overall": "number",
            "postflop": "number",
            "preflop": "number",
            "variant": "string",
          },
          "standard": {
            "gamesPlayed": "number",
            "handReading": "number",
            "kFactor": "number",
            "lastUpdated": "number",
            "math": "number",
            "mental": "number",
            "overall": "number",
            "postflop": "number",
            "preflop": "number",
            "variant": "string",
          },
        },
        "eloRankUp": "null",
        "emotion": {
          "accuracyHistory": "array",
          "consecutiveWrongCount": "number",
          "dailyCorrect": "number",
          "dailyQuestionLimit": "number",
          "dailyQuestionsAnswered": "number",
          "dailyQuestionsDate": "null",
          "dailyTotal": "number",
          "isDownswing": "boolean",
          "moodDate": "null",
          "todayMood": "null",
        },
        "fragmentsEarnedToday": "number",
        "freezeCardFragments": "number",
        "lastDismissalDate": "string",
        "lastFragmentDate": "null",
        "lastQuickDrillDate": "null",
        "mentorStyle": "string",
        "onboarding": {
          "completed": "boolean",
          "currentStep": "number",
          "dailyGoalMinutes": "number",
          "initialAbility": {
            "gtoUnderstanding": "number",
            "oddsCalculation": "number",
            "positionalPlay": "number",
            "rangeKnowledge": "number",
          },
          "startedAt": "number",
        },
        "pendingMilestone": "null",
        "quickDrillBest": "null",
        "quickDrillStreak": "number",
        "records": "array",
        "reviewItems": "array",
        "settings": {
          "defaultQuestionCount": "number",
          "defaultQuizTime": "number",
          "language": "string",
          "soundEnabled": "boolean",
          "theme": "string",
        },
        "streak": {
          "currentStreak": "number",
          "lastMilestoneCelebrated": "null",
          "lastTrainingDate": "null",
          "longestStreak": "number",
          "milestones": {
            "day100": "boolean",
            "day3": "boolean",
            "day30": "boolean",
            "day365": "boolean",
            "day7": "boolean",
          },
          "streakBrokenAt": "null",
          "streakFreezeUsedToday": "boolean",
          "streakFreezes": "number",
          "streakStartDate": "null",
        },
        "unlockedAchievements": "array",
      }
    `);

    // 等待模块底部 setTimeout 副作用执行完毕，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

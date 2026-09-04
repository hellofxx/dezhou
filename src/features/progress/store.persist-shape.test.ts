import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { buildPersistedShape } from '@/shared/utils/persistShape';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/**
 * progress store 持久化形状快照测试。
 *
 * 锁定 persist 实际写入 localStorage 的键结构（partialize 后经 JSON 序列化）。
 * 持久化字段一旦新增 / 删除 / 类型变更，快照即失配、测试变红，
 * 强制作者面对「递增 version + 编写 migrate」的决策，避免漏迁移静默产出半新半旧数据。
 *
 * ⚠️ 快照失配时禁止盲目 `vitest -u`：请先在 store 中递增 persist version 并编写
 *    migrate（防御性合并默认值），再更新本快照（见 AGENTS.md「Persist Version 升级硬性规则」）。
 *
 * P2-01 阶段 A（v13）：records 外迁 IndexedDB，经 partialize 排除出 localStorage
 * （快照中不再包含 records 键；持久化由 recordDatabase 承担，见 utils/recordDatabase.ts）。
 * v14：elo 内存兼容层移除，快照中不再包含顶层 elo 键（ELO 以 eloByVariant 为单一事实源）。
 *
 * v15（新增 persistError）：persistError 与 setPersistError 为运行时标记，
 * 经 partialize 排除出 localStorage，因此不 bump version 且快照不变。
 *
 * v16（理论复习项 key 化）：仅改写已有 reviewItems 元素的**值**（中文原文 → i18n key），
 * 未新增/删除任何持久化键，亦未改变 ReviewItem 字段形状，故本快照与下方元素形状断言均不变。
 *
 * v17（策略复习项 key 化）：同 v16，仅把 category==='strategy' 项的 label 值由中文课名
 * 改写为 academy.lessonTitle.<lessonId> key，持久化键与 ReviewItem 字段形状均不变。
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
        "focusModule": "null",
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

  it('persistError 不出现在 partialize 结果中', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const { partialize } = useProgressStore.persist.getOptions();
    const state = useProgressStore.getState();

    // 设置 persistError（模拟存储失败）
    state.setPersistError({ reason: 'quota', at: Date.now() });
    const updatedState = useProgressStore.getState();
    expect(updatedState.persistError).toBeTruthy();

    // partialize 后应不包含 persistError 与 setPersistError
    const persisted = partialize ? partialize(updatedState) : updatedState;
    expect(persisted).not.toHaveProperty('persistError');
    expect(persisted).not.toHaveProperty('setPersistError');

    // 验证字符串化后也不出现
    const json = JSON.stringify(persisted);
    expect(json).not.toContain('persistError');

    // 等待模块底部 setTimeout 副作用执行完毕
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('reviewItems 元素形状锁定 ReviewItem 契约（顶层快照只记 "array"，内部字段变更须由此检出）', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const { createReviewItem, processReview } = await import('@/shared/utils/spacedRepetition');
    const { partialize } = useProgressStore.persist.getOptions();

    // 以理论学院错题项为探针：它携带本批新增的 metadata.route
    useProgressStore.getState().addReviewItem(
      createReviewItem('theory:t1-combinatorics-q1', '题面摘要', 'theory', {
        source: 'theory',
        route: '/theory/chapter/t1-combinatorics',
        front: '题干原文',
        back: '解析原文',
      }),
    );
    const persisted = (partialize ? partialize(useProgressStore.getState()) : useProgressStore.getState()) as {
      reviewItems: unknown[];
    };
    const probe = persisted.reviewItems.find(
      (r) => (r as { id?: string }).id === 'theory:t1-combinatorics-q1',
    );

    expect(buildPersistedShape(probe)).toEqual({
      id: 'string',
      label: 'string',
      category: 'string',
      easeFactor: 'number',
      interval: 'number',
      repetitions: 'number',
      nextReviewDate: 'string',
      metadata: {
        source: 'string',
        route: 'string',
        front: 'string',
        back: 'string',
      },
    });
    // 新建项尚未复习：lastReviewedAt 为 undefined，不得被序列化进 localStorage
    expect(JSON.stringify(probe)).not.toContain('lastReviewedAt');

    // 复习推进一次后契约扩展：lastReviewedAt 变为数值
    expect(buildPersistedShape(processReview(probe as ReviewItem, 4))).toEqual({
      id: 'string',
      label: 'string',
      category: 'string',
      easeFactor: 'number',
      interval: 'number',
      repetitions: 'number',
      nextReviewDate: 'string',
      lastReviewedAt: 'number',
      metadata: {
        source: 'string',
        route: 'string',
        front: 'string',
        back: 'string',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});
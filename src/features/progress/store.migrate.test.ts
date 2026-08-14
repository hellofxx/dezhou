import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub, buildPersistPayload } from '@/shared/utils/localStorageStub';

/**
 * progress store persist migrate 冒烟测试（v0 → v9 全链路）。
 * migrate 内联在 persist 配置中，通过预置旧版本 localStorage 数据
 * 触发 rehydrate 来验证迁移结果（老用户数据零丢失）。
 */
describe('progress store migrate (v0 → v9)', () => {
  it('老版本数据自动注入全部默认字段，顶层 lastTrainingDate 迁入 streak', async () => {
    // 用本地时间构造时间戳，保证断言与运行环境时区无关
    const oldTimestamp = new Date(2024, 0, 15, 12).getTime();
    const storageStub = createLocalStorageStub({
      'poker-training-progress': buildPersistPayload(
        { records: [], lastTrainingDate: oldTimestamp },
        0
      ),
    });
    // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const state = useProgressStore.getState();

    // v1: onboarding
    expect(state.onboarding).toBeDefined();
    // v2: streak 注入且老 lastTrainingDate 转为 YYYY-MM-DD
    expect(state.streak.lastTrainingDate).toBe('2024-01-15');
    expect(state.streak.streakStartDate).toBe('2024-01-15');
    // 顶层 lastTrainingDate 已删除
    expect('lastTrainingDate' in state).toBe(false);
    // v3: ELO 默认值（经 v10 迁入 eloByVariant.standard；v13/v14 删除顶层 elo）
    expect(state.eloByVariant.standard.overall).toBe(500);
    expect('elo' in state).toBe(false);
    expect(state.eloRankUp).toBeNull();
    // v4: 快速训练打卡
    expect(state.quickDrillStreak).toBe(0);
    expect(state.lastQuickDrillDate).toBeNull();
    // v5: 导师风格
    expect(state.mentorStyle).toBeDefined();
    // v6: 情绪管理
    expect(state.emotion).toBeDefined();
    // v7: 成就系统
    expect(state.unlockedAchievements).toEqual([]);
    expect(state.achievementUnlockDates).toEqual({});
    // v8: 冻结卡碎片
    expect(state.freezeCardFragments).toBe(0);
    expect(state.lastFragmentDate).toBeNull();
    expect(state.fragmentsEarnedToday).toBe(0);
    // v9: 待展示里程碑庆典
    expect(state.pendingMilestone).toBeNull();
    // 已有字段不被触碰
    expect(state.records).toEqual([]);

    // 等待模块底部 setTimeout 副作用执行完毕，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

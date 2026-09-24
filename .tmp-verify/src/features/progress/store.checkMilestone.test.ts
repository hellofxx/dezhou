import { describe, it, expect, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { DEFAULT_STREAK_STATE } from './store';

/**
 * P1-01 修复回归：checkMilestone 在跳档场景（如 earnBack / 导入记录使 streak 从 2 直跳 30）
 * 必须一次性标记全部新达成的里程碑（3/7/30）并累计发放冻结卡奖励。
 * 修复前 checkNewMilestone 仅返回"最大的新达成天数"，3/7 天里程碑被永久跳过、奖励丢失。
 */
describe('progress store checkMilestone 跳档全量标记（P1-01）', () => {
  it('streak=30 且全部未记录 → 一次性标记 3/7/30 并累计发放 4 张冻结卡', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const store = useProgressStore.getState();

    // 构造跳档 streak：currentStreak=30，milestones 全部未达成
    useProgressStore.setState({
      streak: {
        ...DEFAULT_STREAK_STATE,
        currentStreak: 30,
        longestStreak: 30,
        milestones: { day3: false, day7: false, day30: false, day100: false, day365: false },
      },
    });

    const result = store.checkMilestone();

    const after = useProgressStore.getState();
    // 返回最大者（lastMilestoneCelebrated = 30）
    expect(result).toBe(30);
    // 3/7/30 全部标记
    expect(after.streak.milestones).toMatchObject({
      day3: true,
      day7: true,
      day30: true,
    });
    // 100/365 未触发（streak 未达）
    expect(after.streak.milestones.day100).toBe(false);
    // 奖励累计：day3=1 + day7=2 + day30=3 = 6 张（DEFAULT_STREAK_STATE 初始 2 张 + 6 = 8）
    expect(after.streak.streakFreezes).toBe(DEFAULT_STREAK_STATE.streakFreezes + 6);
    // pendingMilestone 展示最大者
    expect(after.pendingMilestone).toBe(30);

    // 等待模块底部 setTimeout 副作用执行完毕
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('逐日正常增长时仅标记当前新增（不重复发放已记录里程碑）', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    const store = useProgressStore.getState();

    // day3 已记录，当前 streak=7 → 仅新增 day7
    useProgressStore.setState({
      streak: {
        ...DEFAULT_STREAK_STATE,
        currentStreak: 7,
        longestStreak: 7,
        milestones: { day3: true, day7: false, day30: false, day100: false, day365: false },
      },
    });

    const result = store.checkMilestone();

    const after = useProgressStore.getState();
    expect(result).toBe(7);
    expect(after.streak.milestones).toMatchObject({ day3: true, day7: true });
    // day7 奖励 2 张
    expect(after.streak.streakFreezes).toBe(DEFAULT_STREAK_STATE.streakFreezes + 2);

    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

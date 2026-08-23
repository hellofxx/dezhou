import { describe, it, expect, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { DEFAULT_STREAK_STATE } from './store';

/**
 * BUG-PRG-003 回归：earnBackStreak 恢复 streak 后必须立即检查里程碑。
 * 修复前不调用 checkMilestone，且 lastTrainingDate 已被置为今日导致当日后续
 * recordTrainingDay 幂等跳过检查，恢复跨里程碑（如 6→7）时庆典与冻结卡奖励
 * 要延迟到次日才补发。
 */
describe('progress store earnBackStreak 里程碑即时检查', () => {
  it('恢复跨里程碑（6→7）→ 立即标记 day7、设置 pendingMilestone 并发放奖励', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    useProgressStore.setState({
      streak: {
        ...DEFAULT_STREAK_STATE,
        currentStreak: 6,
        longestStreak: 6,
        streakBrokenAt: Date.now() - 1000,
        milestones: { day3: true, day7: false, day30: false, day100: false, day365: false },
      },
    });

    useProgressStore.getState().earnBackStreak(6);

    const after = useProgressStore.getState();
    expect(after.streak.currentStreak).toBe(7);
    expect(after.streak.streakBrokenAt).toBeNull();
    // day7 里程碑立即标记并进入待庆祝状态
    expect(after.streak.milestones.day7).toBe(true);
    expect(after.pendingMilestone).toBe(7);
    // day7 奖励 2 张冻结卡（默认 2 + 2 = 4）
    expect(after.streak.streakFreezes).toBe(DEFAULT_STREAK_STATE.streakFreezes + 2);

    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('恢复未跨新里程碑（2→3 且 day3 已标记）→ 不重复庆祝 / 发奖', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { useProgressStore } = await import('./store');
    useProgressStore.setState({
      // store 为模块级单例，重置上一用例遗留的待庆祝里程碑
      pendingMilestone: null,
      streak: {
        ...DEFAULT_STREAK_STATE,
        currentStreak: 2,
        longestStreak: 2,
        streakBrokenAt: Date.now() - 1000,
        milestones: { day3: true, day7: false, day30: false, day100: false, day365: false },
      },
    });

    useProgressStore.getState().earnBackStreak(2);

    const after = useProgressStore.getState();
    expect(after.streak.currentStreak).toBe(3);
    expect(after.pendingMilestone).toBeNull();
    expect(after.streak.streakFreezes).toBe(DEFAULT_STREAK_STATE.streakFreezes);

    await new Promise((resolve) => setTimeout(resolve, 20));
  });
});

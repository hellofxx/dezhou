import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store refreshDailyPlan 测试（每日训练计划）。
 *
 * 回归守卫（BUG-ACA-006 修复）：
 * - 自动/惰性入口（无 force）受同日新鲜度守卫约束：当天重复调用返回同一计划引用
 * - 用户显式刷新（force: true）绕过守卫：当天连续调用始终重新生成新计划，守卫不再吞掉操作
 * - 跨日惰性入口正常重新生成（守卫生效边界不变）
 */

const DAY_MS = 24 * 60 * 60 * 1000;

describe('strategy-academy refreshDailyPlan', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T06:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('首次生成：dailyPlan 为 null 时生成计划并记录 generatedAt', async () => {
    const { useAcademyStore } = await import('./store');
    expect(useAcademyStore.getState().dailyPlan).toBeNull();
    useAcademyStore.getState().refreshDailyPlan();
    const plan = useAcademyStore.getState().dailyPlan;
    expect(plan).not.toBeNull();
    expect(plan?.generatedAt).toBe(Date.now());
  });

  it('惰性入口受同日守卫约束：当天重复调用返回同一计划引用', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().refreshDailyPlan();
    const first = useAcademyStore.getState().dailyPlan;
    vi.advanceTimersByTime(60 * 1000);
    useAcademyStore.getState().refreshDailyPlan();
    expect(useAcademyStore.getState().dailyPlan).toBe(first);
  });

  it('用户显式刷新（force）绕过守卫：同日连续调用产出新计划', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().refreshDailyPlan();
    const first = useAcademyStore.getState().dailyPlan;
    expect(first).not.toBeNull();

    vi.advanceTimersByTime(60 * 1000);
    useAcademyStore.getState().refreshDailyPlan([], { force: true });
    const second = useAcademyStore.getState().dailyPlan;
    expect(second).not.toBe(first); // 守卫不再吞掉显式刷新操作
    expect(second?.generatedAt).toBe(Date.now());

    vi.advanceTimersByTime(60 * 1000);
    useAcademyStore.getState().refreshDailyPlan([], { force: true });
    expect(useAcademyStore.getState().dailyPlan).not.toBe(second);
  });

  it('跨日惰性入口正常重新生成（守卫次日失效）', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().refreshDailyPlan();
    const first = useAcademyStore.getState().dailyPlan;
    vi.setSystemTime(Date.now() + DAY_MS);
    useAcademyStore.getState().refreshDailyPlan();
    const next = useAcademyStore.getState().dailyPlan;
    expect(next).not.toBe(first);
    expect(next?.generatedAt).toBe(Date.now());
  });
});

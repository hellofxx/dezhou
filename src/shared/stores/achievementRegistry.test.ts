/**
 * achievementRegistry 契约（progress store 的依赖倒置注册表）：
 * - 注册后 getAchievementSources 可遍历到（成就检查只依赖本注册表，不 import feature）
 * - 同 id 重复注册必须 upsert（模块热更新 / 重复 bootstrap 不得累积重复项）
 * - 未提供 id 时生成互不相同的兜底 id
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AchievementDataSource } from '@/shared/types/achievementDataSource';
import { getAchievementSources, registerAchievementSource } from './achievementRegistry';

type SourceInput = Omit<AchievementDataSource, 'id'> & { id?: string };

const makeSource = (overrides: Partial<SourceInput> = {}): SourceInput => ({
  isLevelLessonsCompleted: () => false,
  getCertifications: () => ({}),
  areAllLevelsCertified: () => false,
  isTrackCompleted: () => false,
  ...overrides,
});

const idsOf = () =>
  getAchievementSources().map((source) => (source as AchievementDataSource & { id?: string }).id);

describe('achievementRegistry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('注册后可从注册表遍历到，且保留实现引用', () => {
    const isTrackCompleted = vi.fn(() => true);
    registerAchievementSource(makeSource({ id: 'test-reading', isTrackCompleted }));

    const registered = getAchievementSources().find(
      (source) => (source as AchievementDataSource & { id?: string }).id === 'test-reading',
    );
    expect(registered).toBeTruthy();
    expect(registered?.isTrackCompleted('track-1')).toBe(true);
    expect(isTrackCompleted).toHaveBeenCalledWith('track-1');
  });

  it('同 id 重复注册走 upsert：不追加重复项，且替换为最新实现', () => {
    registerAchievementSource(makeSource({ id: 'test-upsert', areAllLevelsCertified: () => false }));
    const countAfterFirst = getAchievementSources().length;

    registerAchievementSource(makeSource({ id: 'test-upsert', areAllLevelsCertified: () => true }));

    expect(getAchievementSources().length).toBe(countAfterFirst);
    const matched = getAchievementSources().filter(
      (source) => (source as AchievementDataSource & { id?: string }).id === 'test-upsert',
    );
    expect(matched).toHaveLength(1);
    expect(matched[0]?.areAllLevelsCertified()).toBe(true);
  });

  it('未提供 id 时生成互不相同的兜底 id（不会互相覆盖）', () => {
    const before = getAchievementSources().length;

    registerAchievementSource(makeSource());
    registerAchievementSource(makeSource());

    expect(getAchievementSources().length).toBe(before + 2);
    const allIds = idsOf();
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('多个不同 id 并存，注册顺序稳定', () => {
    registerAchievementSource(makeSource({ id: 'test-order-a' }));
    registerAchievementSource(makeSource({ id: 'test-order-b' }));

    const allIds = idsOf();
    expect(allIds.indexOf('test-order-a')).toBeLessThan(allIds.indexOf('test-order-b'));
  });
});

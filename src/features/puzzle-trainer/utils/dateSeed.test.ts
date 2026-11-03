/**
 * 日期种子算法单元测试。
 *
 * 契约：
 *  - 同一天（本地时区）返回相同种子与相同日期 key，跨午夜即切换；
 *  - 日期 key 补零为 YYYY-MM-DD（每日完成状态持久化键）；
 *  - 种子随机 / 洗牌为纯函数（同种子同结果、不改源数组）；
 *  - 「今日已有 XXX 人完成」模拟值确定且在 100-999 区间；
 *  - 底层随机基础设施单源在 shared/utils/seededShuffle（本文件只 re-export）。
 */
import { describe, expect, it } from 'vitest';
import {
  getDailyCompletionCount,
  getDailyKey,
  getDateSeed,
  hashStringToSeed,
  pickBySeed,
  seededRandom,
  shuffleBySeed,
} from './dateSeed';
import * as sharedSeededShuffle from '@/shared/utils/seededShuffle';

describe('getDateSeed 日期种子', () => {
  it('按本地年月日拼成 YYYYMMDD 数字', () => {
    expect(getDateSeed(new Date(2026, 6, 25))).toBe(20260725);
    expect(getDateSeed(new Date(2026, 11, 31))).toBe(20261231);
  });

  it('月 / 日补零到两位（1 月 5 日 → 20260105 而非 202615）', () => {
    expect(getDateSeed(new Date(2026, 0, 5))).toBe(20260105);
    expect(getDateSeed(new Date(2026, 8, 9))).toBe(20260909);
  });

  it('同一天内不同时刻返回相同种子（00:00 与 23:59:59 同种子）', () => {
    const startOfDay = new Date(2026, 7, 22, 0, 0, 0, 0);
    const endOfDay = new Date(2026, 7, 22, 23, 59, 59, 999);
    expect(getDateSeed(endOfDay)).toBe(getDateSeed(startOfDay));
  });

  it('跨午夜（23:59:59.999 → 次日 00:00:00.000）种子切换', () => {
    const lastMs = new Date(2026, 1, 28, 23, 59, 59, 999); // 2026 非闰年
    const firstMs = new Date(2026, 2, 1, 0, 0, 0, 0);
    expect(getDateSeed(lastMs)).toBe(20260228);
    expect(getDateSeed(firstMs)).toBe(20260301);
    expect(getDateSeed(firstMs)).not.toBe(getDateSeed(lastMs));
  });
});

describe('getDailyKey 每日完成状态键', () => {
  it('返回 YYYY-MM-DD 且月 / 日补零', () => {
    expect(getDailyKey(new Date(2026, 6, 25))).toBe('2026-07-25');
    expect(getDailyKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('按本地时区取日期（本地 00:30 仍属当天，不受 UTC 偏移影响）', () => {
    const localMidnight = new Date(2026, 7, 22, 0, 30, 0, 0);
    expect(getDailyKey(localMidnight)).toBe('2026-08-22');
    expect(getDateSeed(localMidnight)).toBe(20260822);
    // 与本地日期字段一致（实现不得使用 toISOString 的 UTC 切片）
    expect(getDailyKey(localMidnight)).toBe(
      `${localMidnight.getFullYear()}-${String(localMidnight.getMonth() + 1).padStart(2, '0')}-${String(localMidnight.getDate()).padStart(2, '0')}`
    );
  });

  it('每次调用实时取日期（跨午夜后 key 变化，不被调用方缓存）', () => {
    expect(getDailyKey(new Date(2026, 7, 22, 23, 59, 59, 999))).toBe('2026-08-22');
    expect(getDailyKey(new Date(2026, 7, 23, 0, 0, 0, 0))).toBe('2026-08-23');
  });

  it('与 getDateSeed 同源（同一天：key 去掉连字符即种子）', () => {
    const date = new Date(2026, 3, 7, 15, 30);
    expect(getDailyKey(date).replaceAll('-', '')).toBe(String(getDateSeed(date)));
  });
});

describe('pickBySeed 种子抽取', () => {
  const source = Array.from({ length: 20 }, (_, i) => `q-${i}`);

  it('相同种子重复调用结果完全一致（每日谜题确定性）', () => {
    const first = pickBySeed(source, 8, 20260725);
    const second = pickBySeed(source, 8, 20260725);
    expect(second).toEqual(first);
  });

  it('返回 count 个不重复元素，且均来自源数组', () => {
    const picked = pickBySeed(source, 8, 20260725);
    expect(picked).toHaveLength(8);
    expect(new Set(picked).size).toBe(8);
    for (const item of picked) expect(source).toContain(item);
  });

  it('不修改源数组（纯函数）', () => {
    const snapshot = [...source];
    pickBySeed(source, 8, 20260725);
    expect(source).toEqual(snapshot);
  });

  it('count 超过数组长度时返回打乱后的全量数组', () => {
    const picked = pickBySeed(['a', 'b', 'c'], 10, 42);
    expect(picked).toHaveLength(3);
    expect([...picked].sort()).toEqual(['a', 'b', 'c']);
    expect(picked).toEqual(shuffleBySeed(['a', 'b', 'c'], 42));
  });
});

describe('getDailyCompletionCount 今日完成人数模拟', () => {
  const date = new Date(2026, 7, 22);

  it('同一天返回同一数值（确定性）', () => {
    expect(getDailyCompletionCount(date)).toBe(getDailyCompletionCount(new Date(2026, 7, 22, 21, 0)));
  });

  it('落在 100-999 区间（UI 展示与 i18n 计数假定）', () => {
    const values = Array.from({ length: 30 }, (_, i) => getDailyCompletionCount(new Date(2026, 0, 1 + i)));
    for (const value of values) {
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(999);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('跨日期会变化（不是常量）', () => {
    const values = new Set(
      Array.from({ length: 10 }, (_, i) => getDailyCompletionCount(new Date(2026, 0, 1 + i)))
    );
    expect(values.size).toBeGreaterThan(1);
  });
});

describe('底层随机基础设施单源', () => {
  it('re-export 与 shared/utils/seededShuffle 为同一函数引用', () => {
    expect(seededRandom).toBe(sharedSeededShuffle.seededRandom);
    expect(shuffleBySeed).toBe(sharedSeededShuffle.shuffleBySeed);
    expect(hashStringToSeed).toBe(sharedSeededShuffle.hashStringToSeed);
  });
});

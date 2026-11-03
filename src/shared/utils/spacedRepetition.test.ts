/**
 * spacedRepetition（SRS / SM-2 简化版）契约：
 * - 日期一律走本地时区 YYYY-MM-DD（禁用 UTC 口径，否则 UTC+8 的凌晨会错位一天）
 * - 答对推进间隔、答错有界回退（不回零，避免单次失误抹掉全部调度进度）
 * - 今日待复习筛选与排序、复习统计、分数 → quality 映射
 * 时间全部由 fake timers 固定，避免跨日抖动。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FAST_ANSWER_SECONDS,
  answerQuality,
  createReviewItem,
  getDaysSinceLastReview,
  getReviewStats,
  getTodayReviewItems,
  getTodayString,
  processReview,
  quizScoreToQuality,
  toLocalDateString,
  updateReviewQueue,
  upsertReviewItem,
  type ReviewItem,
} from './spacedRepetition';

/** 固定"今天"为本地时间 2025-01-15 23:30（UTC 已是 01-16，用于锁定本地时区口径） */
const NOW = new Date(2025, 0, 15, 23, 30, 0);

const baseItem = (overrides: Partial<ReviewItem> = {}): ReviewItem => ({
  id: 'strategy:l1',
  label: '位置的力量',
  category: 'strategy',
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  nextReviewDate: '2025-01-15',
  ...overrides,
});

describe('spacedRepetition — 日期口径', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toLocalDateString 取本地时区日期，而非 UTC 日期', () => {
    expect(toLocalDateString(NOW)).toBe('2025-01-15');
    expect(toLocalDateString(NOW.getTime())).toBe('2025-01-15');
    expect(toLocalDateString()).toBe('2025-01-15');
    expect(getTodayString()).toBe('2025-01-15');
  });
});

describe('spacedRepetition — 答对推进', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('新建项首次答对：repetitions=1、间隔进入第 1 档（1 天）、次日复习', () => {
    const next = processReview(createReviewItem('l1', '标签', 'strategy'), 4);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
    expect(next.nextReviewDate).toBe('2025-01-16');
    expect(next.lastReviewedAt).toBe(NOW.getTime());
  });

  it('quality=5 抬升难度因子，quality=3 下调，均被夹在 [1.3, 3.0]', () => {
    expect(processReview(baseItem(), 5).easeFactor).toBeCloseTo(2.6, 10);
    expect(processReview(baseItem(), 4).easeFactor).toBeCloseTo(2.5, 10);
    expect(processReview(baseItem(), 3).easeFactor).toBeCloseTo(2.36, 10);
    expect(processReview(baseItem({ easeFactor: 3 }), 5).easeFactor).toBeCloseTo(3, 10);
  });

  it('间隔序列封顶 30 天，不随 repetitions 无限增长', () => {
    const capped = processReview(baseItem({ repetitions: 10, interval: 30 }), 4);
    expect(capped.interval).toBe(30);
    expect(capped.nextReviewDate).toBe('2025-02-14');
  });

  it('间隔随难度因子按比例缩放（ease 3.0 → 基准 1 天 × 3.0/2.5）', () => {
    const scaled = processReview(baseItem({ easeFactor: 3 }), 4);
    expect(scaled.interval).toBe(1);
    // 第 2 档基准 3 天 × 1.2 → 3.6 取整 4 天
    const secondTier = processReview(baseItem({ repetitions: 1, easeFactor: 3 }), 4);
    expect(secondTier.interval).toBe(4);
  });

  it('quality 超过 5 视为 5，负数视为 0（走失败分支）', () => {
    expect(processReview(baseItem(), 9).easeFactor).toBeCloseTo(2.6, 10);
    const failed = processReview(baseItem({ repetitions: 3, interval: 7 }), -1);
    expect(failed.repetitions).toBe(2);
  });
});

describe('spacedRepetition — 答错有界回退', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('repetitions 只回退 1 步，不清零（已到 30 天档的项不从头爬起）', () => {
    const next = processReview(baseItem({ repetitions: 5, interval: 30 }), 1);
    expect(next.repetitions).toBe(4);
    expect(next.interval).toBe(14);
  });

  it('回退间隔按序列前一档取值：rep 3→3 天 / rep 2→1 天 / rep 0→1 天', () => {
    expect(processReview(baseItem({ repetitions: 3, interval: 7 }), 1).interval).toBe(3);
    expect(processReview(baseItem({ repetitions: 2, interval: 3 }), 1).interval).toBe(1);
    expect(processReview(baseItem({ repetitions: 0 }), 1).interval).toBe(1);
  });

  it('难度因子仅下调 0.2，并夹在下限 1.3', () => {
    expect(processReview(baseItem(), 1).easeFactor).toBeCloseTo(2.3, 10);
    expect(processReview(baseItem({ easeFactor: 1.4 }), 1).easeFactor).toBeCloseTo(1.3, 10);
  });
});

describe('spacedRepetition — 复习队列筛选 / 统计', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('只取 nextReviewDate <= 今天，并按到期日期升序、同日按难度因子升序', () => {
    const items = [
      baseItem({ id: 'future', nextReviewDate: '2025-01-16' }),
      baseItem({ id: 'today-hard', nextReviewDate: '2025-01-15', easeFactor: 1.4 }),
      baseItem({ id: 'overdue', nextReviewDate: '2025-01-10', easeFactor: 2.5 }),
      baseItem({ id: 'today-easy', nextReviewDate: '2025-01-15', easeFactor: 2.8 }),
    ];
    const due = getTodayReviewItems(items);

    expect(due.map((item) => item.id)).toEqual(['overdue', 'today-hard', 'today-easy']);
    // 不改动入参数组
    expect(items).toHaveLength(4);
  });

  it('间隔 >= 14 天记为已掌握，其余计入学习中；dueToday 单独统计', () => {
    const stats = getReviewStats([
      baseItem({ id: 'a', interval: 30, nextReviewDate: '2025-01-15' }),
      baseItem({ id: 'b', interval: 14, nextReviewDate: '2025-03-01' }),
      baseItem({ id: 'c', interval: 3, nextReviewDate: '2025-01-10' }),
      baseItem({ id: 'd', interval: 1, nextReviewDate: '2025-02-01' }),
    ]);

    expect(stats).toEqual({ total: 4, mastered: 2, learning: 2, dueToday: 2 });
  });

  it('getDaysSinceLastReview 无复习记录返回 null，否则按整天向下取整', () => {
    expect(getDaysSinceLastReview(baseItem())).toBeNull();
    const twoAndHalfDaysAgo = NOW.getTime() - 2.5 * 86_400_000;
    expect(getDaysSinceLastReview(baseItem({ lastReviewedAt: twoAndHalfDaysAgo }))).toBe(2);
  });
});

describe('spacedRepetition — quality 映射', () => {
  it('answerQuality：答对且快于阈值 → 5，答对慢 → 4，答错 → 1', () => {
    expect(answerQuality(true, FAST_ANSWER_SECONDS * 1000 - 1)).toBe(5);
    expect(answerQuality(true, FAST_ANSWER_SECONDS * 1000)).toBe(4);
    expect(answerQuality(false, 100)).toBe(1);
  });

  it('quizScoreToQuality：90/75/60 为分档边界，最低档 2（不产生遗忘档）', () => {
    expect([95, 90, 89, 75, 74, 60, 59, 0].map(quizScoreToQuality)).toEqual([5, 5, 4, 4, 3, 3, 2, 2]);
  });
});

describe('spacedRepetition — updateReviewQueue / upsertReviewItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('已存在项按分数推进，其余项原样保留且顺序不变', () => {
    const items = [
      baseItem({ id: 'other', repetitions: 7 }),
      baseItem({ id: 'l1', repetitions: 0, interval: 0 }),
    ];
    const updated = updateReviewQueue(items, 'l1', '位置的力量', 95);

    expect(updated.map((item) => item.id)).toEqual(['other', 'l1']);
    expect(updated[0]?.repetitions).toBe(7);
    expect(updated[1]?.repetitions).toBe(1);
  });

  it('新课程：高分 3 天后再复习，中等 1 天，低分 1 天且难度因子下调到 2.2', () => {
    const high = updateReviewQueue([], 'new-1', '新课', 92)[0]!;
    expect([high.interval, high.nextReviewDate]).toEqual([3, '2025-01-18']);

    const mid = updateReviewQueue([], 'new-2', '新课', 70)[0]!;
    expect([mid.interval, mid.nextReviewDate, mid.easeFactor]).toEqual([1, '2025-01-16', 2.5]);

    const low = updateReviewQueue([], 'new-3', '新课', 40)[0]!;
    expect([low.interval, low.nextReviewDate, low.easeFactor]).toEqual([1, '2025-01-16', 2.2]);
  });

  it('upsertReviewItem：新项携带 metadata 并已推进；已存在项不覆盖 metadata', () => {
    const created = upsertReviewItem([], 'range:btn:AKs', 'BTN AKs', 'range', { front: '前', back: '后' }, 4);
    expect(created.isNew).toBe(true);
    expect(created.item.metadata).toEqual({ front: '前', back: '后' });
    expect(created.item.repetitions).toBe(1);

    const existing = upsertReviewItem([created.item], 'range:btn:AKs', '新标签', 'range', { front: '覆盖' }, 1);
    expect(existing.isNew).toBe(false);
    expect(existing.item.label).toBe('BTN AKs');
    expect(existing.item.metadata).toEqual({ front: '前', back: '后' });
  });
});

describe('spacedRepetition — createReviewItem 初始形状', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('默认 easeFactor 2.5、interval/repetitions 为 0、次日开始复习', () => {
    const item = createReviewItem('l1', '标签', 'strategy');
    expect(item).toEqual({
      id: 'l1',
      label: '标签',
      category: 'strategy',
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewDate: '2025-01-16',
      lastReviewedAt: undefined,
      metadata: undefined,
    });
  });
});

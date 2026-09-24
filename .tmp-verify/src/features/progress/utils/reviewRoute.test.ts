import { describe, expect, it } from 'vitest';
import { getReviewRoute } from './reviewRoute';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/**
 * 复习项跳转路由解析守卫。
 *
 * 关键回归点：理论学院接入 SRS 后会产生 category='theory' 的复习项。
 * 若 getReviewRoute 缺 theory 分支，这些项会落入 default 分支被拼成
 * /academy/lesson/theory:<questionId> —— 一批指向策略学院的死链。
 */

function item(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    ...createReviewItem('probe-id', '探针', 'strategy'),
    ...overrides,
  };
}

describe('getReviewRoute（分类 → 路由映射）', () => {
  it('四个训练分类各自落到本模块主页', () => {
    expect(getReviewRoute(item({ category: 'range' }))).toBe('/range-trainer');
    expect(getReviewRoute(item({ category: 'odds' }))).toBe('/pot-odds');
    expect(getReviewRoute(item({ category: 'gto' }))).toBe('/gto-simulator');
  });

  it('strategy 用 item.id 拼课程页（既有行为不变）', () => {
    expect(getReviewRoute(item({ category: 'strategy', id: 'l3-cbet' }))).toBe(
      '/academy/lesson/l3-cbet',
    );
  });

  it('未知分类回退策略学院课程页（default 分支保留）', () => {
    expect(getReviewRoute(item({ category: 'mystery', id: 'x-1' }))).toBe('/academy/lesson/x-1');
  });
});

describe('getReviewRoute（metadata.route 优先）', () => {
  it('自带 route 时优先使用，理论错题跳回所属章节页', () => {
    const theory = item({
      category: 'theory',
      id: 'theory:t1-combinatorics-q1',
      metadata: { source: 'theory', route: '/theory/chapter/t1-combinatorics' },
    });
    expect(getReviewRoute(theory)).toBe('/theory/chapter/t1-combinatorics');
  });

  it('route 对其它分类同样是显式覆盖通道', () => {
    expect(getReviewRoute(item({ category: 'gto', metadata: { route: '/pot-odds' } }))).toBe(
      '/pot-odds',
    );
  });

  it('非绝对路径的脏 route 值不采信，回退分类映射（防御老/异常数据）', () => {
    expect(getReviewRoute(item({ category: 'range', metadata: { route: 'javascript:alert(1)' } }))).toBe(
      '/range-trainer',
    );
  });
});

describe('getReviewRoute（向后兼容老存量项）', () => {
  it('理论项缺 metadata（route 字段尚未引入时写入）也不得产出死链', () => {
    const legacy = item({ category: 'theory', id: 'theory:t1-combinatorics-q1', metadata: undefined });
    const route = getReviewRoute(legacy);
    expect(route).toBe('/theory');
    expect(route).not.toContain('/academy/lesson');
  });

  it('metadata 存在但无 route 时，理论项仍回退理论学院主页', () => {
    expect(
      getReviewRoute(item({ category: 'theory', metadata: { source: 'theory', front: 'Q' } })),
    ).toBe('/theory');
  });

  it('任意输入均返回以 / 开头的路由，绝不抛错', () => {
    for (const category of ['strategy', 'range', 'odds', 'gto', 'theory', '', 'unknown']) {
      expect(getReviewRoute(item({ category }))).toMatch(/^\//);
    }
  });
});

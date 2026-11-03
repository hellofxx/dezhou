/**
 * navSections 契约（壳层眉标与页名的纯函数出口）：
 * - 路径 → 分组序号（01 训练 / 02 研习 / 03 数据 / 04 设置），未命中回退 00 + 应用名
 * - 前缀匹配必须按路径段边界（`/help` 命中，`/helpfoo` 不命中）
 * - 路径 → 页名：精确表优先，子路由回退到模块名（避免子页断档成应用名）
 */
import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { resolveNavSection, resolvePageTitle } from './navSections';

/** 测试用 t：直接回传 key，便于断言「解析到了哪个 key」 */
const t = ((key: string) => key) as unknown as TFunction;

describe('resolveNavSection', () => {
  it('四个分组前缀分别映射到 01/02/03/04 序号', () => {
    expect(resolveNavSection('/range-trainer', t)).toEqual({ index: '01', label: 'nav.training' });
    expect(resolveNavSection('/puzzle/daily', t)).toEqual({ index: '01', label: 'nav.training' });
    expect(resolveNavSection('/academy', t)).toEqual({ index: '02', label: 'nav.study' });
    expect(resolveNavSection('/hand-history/import', t)).toEqual({ index: '02', label: 'nav.study' });
    expect(resolveNavSection('/progress/range', t)).toEqual({ index: '03', label: 'nav.data' });
    expect(resolveNavSection('/leaderboard', t)).toEqual({ index: '03', label: 'nav.data' });
    expect(resolveNavSection('/settings', t)).toEqual({ index: '04', label: 'nav.settingsGroup' });
    expect(resolveNavSection('/help/article/a1', t)).toEqual({ index: '04', label: 'nav.settingsGroup' });
  });

  it('首页与未知路径回退 00 号分组 + 应用名', () => {
    expect(resolveNavSection('/', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
    expect(resolveNavSection('/unknown-path', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
  });

  it('前缀按路径段边界匹配，不吞掉同名开头路径', () => {
    expect(resolveNavSection('/helpfoo', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
    expect(resolveNavSection('/settingsx', t)).toEqual({ index: '00', label: 'nav.appSubtitle' });
  });
});

describe('resolvePageTitle', () => {
  it('精确路径命中专属页名', () => {
    expect(resolvePageTitle('/', t)).toBe('nav.dashboard');
    expect(resolvePageTitle('/academy/basics', t)).toBe('nav.basics');
    expect(resolvePageTitle('/theory/review', t)).toBe('nav.theoryReview');
    expect(resolvePageTitle('/help', t)).toBe('nav.help');
  });

  it('子路由回退到所属模块名（不断档成应用名）', () => {
    expect(resolvePageTitle('/theory/chapter/l1', t)).toBe('nav.theory');
    expect(resolvePageTitle('/academy/lesson/local-x', t)).toBe('nav.academy');
    expect(resolvePageTitle('/help/article/a1', t)).toBe('nav.help');
    expect(resolvePageTitle('/puzzle/theme/x', t)).toBe('nav.puzzle');
  });

  it('未注册路径回退应用名', () => {
    expect(resolvePageTitle('/nowhere', t)).toBe('nav.appSubtitle');
  });
});

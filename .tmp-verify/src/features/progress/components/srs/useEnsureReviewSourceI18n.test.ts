/**
 * collectReviewSourceModules 单测（Node 环境，纯函数）。
 *
 * 复习项 label / metadata.front|back 存 i18n key，而其翻译包按路由懒加载，首页分组不含
 * theory / rangeTrainer / potOdds / gto —— 本函数决定渲染时要按需补加载哪些包，
 * 漏一个来源即意味着该来源的复习项在冷启动首页显示 key 字面量。
 */
import { describe, it, expect } from 'vitest';
import { collectReviewSourceModules } from './useEnsureReviewSourceI18n';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';

type Source = NonNullable<ReviewItemMetadata['source']>;

function itemWithSource(source: Source): ReviewItem {
  return createReviewItem(`k:${source}`, 'some.i18n.key', 'x', { source });
}

describe('collectReviewSourceModules', () => {
  it('理论复习项映射到 theory 翻译包（首页路由分组未含它，必须按需补加载）', () => {
    expect(collectReviewSourceModules([itemWithSource('theory')])).toEqual(['theory']);
  });

  it('range / odds / gto 三种来源各自映射到对应模块 key', () => {
    expect(collectReviewSourceModules([itemWithSource('range')])).toEqual(['rangeTrainer']);
    expect(collectReviewSourceModules([itemWithSource('odds')])).toEqual(['potOdds']);
    expect(collectReviewSourceModules([itemWithSource('gto')])).toEqual(['gto']);
  });

  it('strategy 来源不需补加载（academy 属 CORE_MODULES，启动即就绪）', () => {
    expect(collectReviewSourceModules([itemWithSource('strategy')])).toEqual([]);
  });

  it('多来源去重且顺序稳定（避免依赖数组反复触发加载）', () => {
    const items = [
      itemWithSource('theory'),
      itemWithSource('range'),
      itemWithSource('theory'),
    ];
    expect(collectReviewSourceModules(items)).toEqual(['rangeTrainer', 'theory']);
    expect(collectReviewSourceModules(items)).toEqual(collectReviewSourceModules(items));
  });

  it('无 metadata / 无 source 的老存量复习项被忽略且不抛错', () => {
    const legacy: ReviewItem = createReviewItem('legacy-id', '老知识点', 'strategy');
    expect(collectReviewSourceModules([legacy, itemWithSource('theory')])).toEqual(['theory']);
    expect(collectReviewSourceModules([])).toEqual([]);
  });
});

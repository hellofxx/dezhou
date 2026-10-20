import type { PokerVariant } from '@/shared/types/elo';
import type { TheoryLevelInfo } from '../../types';

/**
 * 理论完整数据（含正文/小测）按变体懒加载。
 * 首页与 store 只读 manifest；这里是章节页/疑难清单唯一的完整数据入口，
 * 动态 import 保证 Vite 为每个变体产出独立 chunk，互不牵连。
 */

const loaders: Record<PokerVariant, () => Promise<TheoryLevelInfo[]>> = {
  standard: () => import('./variants/standard').then((mod) => mod.standardLevels),
  'short-deck': () => import('./variants/short-deck').then((mod) => mod.shortDeckLevels),
  'heads-up': () => import('./variants/heads-up').then((mod) => mod.headsUpLevels),
};

const cache = new Map<PokerVariant, TheoryLevelInfo[]>();
const inflight = new Map<PokerVariant, Promise<TheoryLevelInfo[]>>();

export function loadTheoryLevelsForVariant(variant: PokerVariant): Promise<TheoryLevelInfo[]> {
  const cached = cache.get(variant);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(variant);
  if (existing) return existing;
  const task = loaders[variant]()
    .then((levels) => {
      cache.set(variant, levels);
      return levels;
    })
    .finally(() => inflight.delete(variant));
  inflight.set(variant, task);
  return task;
}

/** 同步读取已加载的变体数据；任一缺失返回 null（渲染期判断，避免已缓存时闪骨架） */
export function getLoadedTheoryLevels(
  variants: readonly PokerVariant[],
): TheoryLevelInfo[] | null {
  const unique = [...new Set(variants)];
  const levels: TheoryLevelInfo[] = [];
  for (const variant of unique) {
    const data = cache.get(variant);
    if (!data) return null;
    levels.push(...data);
  }
  return levels;
}

export function loadTheoryLevelsForVariants(
  variants: readonly PokerVariant[],
): Promise<TheoryLevelInfo[]> {
  const unique = [...new Set(variants)];
  return Promise.all(unique.map(loadTheoryLevelsForVariant)).then((results) => results.flat());
}

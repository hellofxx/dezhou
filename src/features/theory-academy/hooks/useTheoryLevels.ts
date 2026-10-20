import { useEffect, useState } from 'react';
import type { PokerVariant } from '@/shared/types/elo';
import type { TheoryLevelInfo } from '../types';
import {
  getLoadedTheoryLevels,
  loadTheoryLevelsForVariants,
} from '../data/levels/loaders';

/**
 * 按变体加载理论完整数据。
 * - 已缓存：同步返回，章节间切换不闪骨架
 * - 未缓存：返回 null（调用方渲染骨架），加载完成后触发重渲染
 * - 加载失败：返回空数组，由上层的数据缺失分支兜底（不无限挂起）
 */
export function useTheoryLevels(
  variants: readonly PokerVariant[],
): TheoryLevelInfo[] | null {
  const unique = [...new Set(variants)].toSorted();
  const key = unique.join(',');
  const cached = getLoadedTheoryLevels(unique);
  const [loaded, setLoaded] = useState<{ key: string; levels: TheoryLevelInfo[] } | null>(
    cached ? { key, levels: cached } : null,
  );

  useEffect(() => {
    if (!key) return;
    const requested = key.split(',') as PokerVariant[];
    const cachedNow = getLoadedTheoryLevels(requested);
    if (cachedNow) {
      setLoaded((previous) =>
        previous?.key === key ? previous : { key, levels: cachedNow },
      );
      return;
    }
    let cancelled = false;
    void loadTheoryLevelsForVariants(requested)
      .then((levels) => {
        if (!cancelled) setLoaded({ key, levels });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, levels: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key) return [];
  return cached ?? (loaded?.key === key ? loaded.levels : null);
}

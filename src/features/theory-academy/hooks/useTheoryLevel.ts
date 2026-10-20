import { useEffect, useState } from 'react';
import type { TheoryLevelInfo } from '../types';
import { getLoadedTheoryLevel, loadTheoryLevelById } from '../data/levels/loaders';

/**
 * 按 Level 加载理论完整数据（章节页唯一入口）。
 * - 已缓存：同步返回，章节间切换不闪骨架
 * - 加载中：返回 undefined（调用方渲染骨架）
 * - 加载失败 / Level 不存在：返回 null（调用方回目录）
 */
export function useTheoryLevel(
  levelId: string | undefined,
): TheoryLevelInfo | null | undefined {
  const cached = levelId ? getLoadedTheoryLevel(levelId) : undefined;
  const [loaded, setLoaded] = useState<{ id: string; level: TheoryLevelInfo | null } | null>(
    cached && levelId ? { id: levelId, level: cached } : null,
  );

  useEffect(() => {
    if (!levelId) return;
    const cachedNow = getLoadedTheoryLevel(levelId);
    if (cachedNow) {
      setLoaded((previous) =>
        previous?.id === levelId && previous.level === cachedNow
          ? previous
          : { id: levelId, level: cachedNow },
      );
      return;
    }
    let cancelled = false;
    void loadTheoryLevelById(levelId)
      .then((level) => {
        if (!cancelled) setLoaded({ id: levelId, level: level ?? null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id: levelId, level: null });
      });
    return () => {
      cancelled = true;
    };
  }, [levelId]);

  if (!levelId) return null;
  const cachedNow = getLoadedTheoryLevel(levelId);
  if (cachedNow) return cachedNow;
  return loaded?.id === levelId ? loaded.level : undefined;
}

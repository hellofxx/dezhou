import { describe, expect, it } from 'vitest';
import type { PokerVariant } from '@/shared/types/elo';
import {
  getLoadedTheoryLevels,
  loadTheoryLevelsForVariant,
  loadTheoryLevelsForVariants,
} from './loaders';
import { getLevelSummariesByVariant } from '../../utils/theoryMeta';

/**
 * 完整数据按变体动态加载的映射守卫：
 * 防止 loaders 把某个变体指向错误的模块（首页/manifest 仍会正常，章节页却错内容）。
 */

const VARIANTS: PokerVariant[] = ['standard', 'short-deck', 'heads-up'];

describe('theory 完整数据按变体懒加载', () => {
  it('未加载时 getLoadedTheoryLevels 返回 null，且不会误报已就绪', () => {
    expect(getLoadedTheoryLevels(['short-deck'])).toBeNull();
  });

  it('逐变体加载后与 manifest 的 Level/章节目录完全一致', async () => {
    for (const variant of VARIANTS) {
      const levels = await loadTheoryLevelsForVariant(variant);
      const summary = getLevelSummariesByVariant(variant);
      expect(levels.map((level) => level.id)).toEqual(summary.map((level) => level.id));
      expect(levels.flatMap((level) => level.chapters).map((chapter) => chapter.id)).toEqual(
        summary.flatMap((level) => level.chapters).map((chapter) => chapter.id),
      );
    }
  });

  it('全部变体加载后按入参顺序拼接；多变体批量加载去重', async () => {
    const levels = await loadTheoryLevelsForVariants(['heads-up', 'standard', 'heads-up']);
    expect(getLoadedTheoryLevels(['heads-up', 'standard'])).toEqual(levels);
    expect(levels[0]?.variant).toBe('heads-up');
  });
});

import { describe, expect, it } from 'vitest';
import type { PokerVariant } from '@/shared/types/elo';
import {
  getLoadedTheoryLevel,
  getLoadedTheoryLevels,
  loadTheoryLevelById,
  loadTheoryLevelsForVariant,
  loadTheoryLevelsForVariants,
} from './loaders';
import { getLevelSummariesByVariant } from '../../utils/theoryMeta';

/**
 * 完整数据懒加载映射守卫：
 * - 章节页按 Level 加载，单个 Level 不能串入其他章节；
 * - 全变体加载（疑难清单）与 manifest 的 Level/章节目录完全一致。
 */

const VARIANTS: PokerVariant[] = ['standard', 'short-deck', 'heads-up'];

describe('theory 完整数据按变体懒加载', () => {
  it('未加载时 getLoadedTheoryLevels 返回 null，且不会误报已就绪', () => {
    expect(getLoadedTheoryLevels(['short-deck'])).toBeNull();
  });

  it('按 Level 加载时只返回该 Level 的章节，与 manifest 一致', async () => {
    for (const variant of VARIANTS) {
      for (const summary of getLevelSummariesByVariant(variant)) {
        const level = await loadTheoryLevelById(summary.id);
        expect(level?.id).toBe(summary.id);
        expect(level?.variant).toBe(variant);
        expect(level?.chapters.map((chapter) => chapter.id)).toEqual(
          summary.chapters.map((chapter) => chapter.id),
        );
        expect(getLoadedTheoryLevel(summary.id)).toBe(level);
      }
    }
  });

  it('未知 Level 返回 undefined', async () => {
    expect(await loadTheoryLevelById('t99')).toBeUndefined();
    expect(getLoadedTheoryLevel('t99')).toBeUndefined();
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

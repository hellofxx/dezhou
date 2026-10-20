import { describe, expect, it } from 'vitest';
import { headsUpLevels } from './variants/heads-up';
import { shortDeckLevels } from './variants/short-deck';
import { standardLevels } from './variants/standard';
import {
  ALL_VARIANT_LEVEL_SUMMARIES,
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from './manifest';
import { inferVariantFromChapterId } from '../../utils/theoryMeta';
import type { TheoryLevelInfo, TheoryLevelSummary } from '../../types';

/**
 * 摘要 manifest ↔ 完整数据一致性守卫。
 * 首页/store 只读 manifest；它一旦落后于 variants/*，目录、解锁与进度会静默错位。
 * 失败时运行 `pnpm theory:manifest` 重新生成。
 */

function project(level: TheoryLevelInfo): TheoryLevelSummary {
  return {
    id: level.id,
    level: level.level,
    tier: level.tier,
    title: level.title,
    description: level.description,
    icon: level.icon,
    unlockRequirement: level.unlockRequirement,
    variant: level.variant,
    practiceRecommendations: level.practiceRecommendations,
    chapters: level.chapters.map((chapter) => ({
      id: chapter.id,
      level: chapter.level,
      order: chapter.order,
      title: chapter.title,
      subtitle: chapter.subtitle,
      duration: chapter.duration,
      variant: chapter.variant,
    })),
  };
}

const CASES = [
  { name: 'standard', full: standardLevels, summary: STANDARD_LEVEL_SUMMARIES },
  { name: 'short-deck', full: shortDeckLevels, summary: SHORT_DECK_LEVEL_SUMMARIES },
  { name: 'heads-up', full: headsUpLevels, summary: HEADS_UP_LEVEL_SUMMARIES },
] as const;

describe('theory manifest 与完整数据一致', () => {
  for (const { name, full, summary } of CASES) {
    it(`${name}：Level/章节目录字段逐项一致（落后时运行 pnpm theory:manifest）`, () => {
      expect(summary).toEqual(full.map(project));
    });
  }

  it('ALL_VARIANT_LEVEL_SUMMARIES 按 standard → short-deck → heads-up 拼接', () => {
    expect(ALL_VARIANT_LEVEL_SUMMARIES).toEqual([
      ...STANDARD_LEVEL_SUMMARIES,
      ...SHORT_DECK_LEVEL_SUMMARIES,
      ...HEADS_UP_LEVEL_SUMMARIES,
    ]);
  });

  it('章节 id 的变体推断与数据一致（章节页按变体懒载的前置契约）', () => {
    for (const { full } of CASES) {
      for (const level of full) {
        for (const chapter of level.chapters) {
          expect(inferVariantFromChapterId(chapter.id), chapter.id).toBe(chapter.variant);
        }
      }
    }
  });
});

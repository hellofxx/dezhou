/**
 * Heads-Up（单挑）理论 Level 聚合。
 * 各 Level 内容分散于 headsUpLevel1.ts ~ headsUpLevel9.ts（每 Level 单文件），
 * 本文件仅负责聚合导出 headsUpLevels，供变体索引消费。
 * ID 命名规则：t{level}hu-{topic}
 */
import type { TheoryLevelInfo } from '../../../../types';
import { CHAPTER_PRACTICE_RECOMMENDATIONS } from './chapterPracticeMap';
import { HEADS_UP_LEVEL_1 } from './headsUpLevel1';
import { HEADS_UP_LEVEL_2 } from './headsUpLevel2';
import { HEADS_UP_LEVEL_3 } from './headsUpLevel3';
import { HEADS_UP_LEVEL_4 } from './headsUpLevel4';
import { HEADS_UP_LEVEL_5 } from './headsUpLevel5';
import { HEADS_UP_LEVEL_6 } from './headsUpLevel6';
import { HEADS_UP_LEVEL_7 } from './headsUpLevel7';
import { HEADS_UP_LEVEL_8 } from './headsUpLevel8';
import { HEADS_UP_LEVEL_9 } from './headsUpLevel9';

/**
 * 把章节级实践推荐附加到章节对象（章节数据文件本身不声明该字段）。
 * 引用的是策略学院变体课时 id 字符串，不产生模块 import；因变体课时不在策略学院
 * `LEVELS` 内、无法进任何白名单，存在性由
 * `strategy-academy/data/theoryVariantBridgeIntegrity.test.ts` 反向守卫。
 */
function withChapterPractice(levels: TheoryLevelInfo[]): TheoryLevelInfo[] {
  return levels.map((level) => ({
    ...level,
    chapters: level.chapters.map((chapter) => {
      const recommendation = CHAPTER_PRACTICE_RECOMMENDATIONS[chapter.id];
      return recommendation ? { ...chapter, practiceRecommendations: recommendation } : chapter;
    }),
  }));
}

/** Heads-Up 全部 Level（T1-T9） */
export const headsUpLevels: TheoryLevelInfo[] = withChapterPractice([
  HEADS_UP_LEVEL_1,
  HEADS_UP_LEVEL_2,
  HEADS_UP_LEVEL_3,
  HEADS_UP_LEVEL_4,
  HEADS_UP_LEVEL_5,
  HEADS_UP_LEVEL_6,
  HEADS_UP_LEVEL_7,
  HEADS_UP_LEVEL_8,
  HEADS_UP_LEVEL_9,
]);

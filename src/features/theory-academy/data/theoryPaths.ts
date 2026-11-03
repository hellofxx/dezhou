import type { TheoryPathTag } from '../types';

/**
 * 理论学院学习路径（静态数据，展示层，不门禁）。
 *
 * 三条路径是「按主题串读」的推荐清单，不引入任何新的解锁条件：
 * 成员章节能否进入仍只取决于其所属 Level 是否解锁（由 theoryMeta 的既有判定负责）。
 * `tag` 与章节的 `pathTags`（data/levels/variants/standard/chapterMeta.ts 打标）对应，
 * 成员一致性由 data/theoryPaths.integrity.test.ts 守卫。
 */

export interface TheoryPath {
  /** 路径 id，同时是 i18n key 前缀（theory.paths.<id>.title / .description） */
  id: string;
  /** 主题标签：成员的 pathTags 必须包含它 */
  tag: TheoryPathTag;
  /** 成员章节 id，顺序即阅读顺序 */
  chapterIds: string[];
}

/** 三条学习路径（顺序即首页展示顺序） */
export const THEORY_PATHS: TheoryPath[] = [
  {
    id: 'sixmax-cash-core',
    tag: 'six-max',
    chapterIds: [
      't1-sixmax-table',
      't3-blind-battle',
      't4-sixmax-ranges',
      't6-srp-postflop',
      't6-3bet-pot',
      't6-turn-river',
      't9-sixmax-capstone',
    ],
  },
  {
    id: 'postflop-deep',
    tag: 'postflop',
    chapterIds: [
      't4-range-advantage',
      't5-mdf-alpha',
      't6-bet-purpose',
      't6-sizing-theory',
      't6-geometric',
      't6-srp-postflop',
      't6-3bet-pot',
      't6-turn-river',
    ],
  },
  {
    id: 'mtt-bridge',
    tag: 'mtt',
    chapterIds: [
      't4-structure-economics',
      't5-multiway-frequency',
      't9-icm',
      't9-multiway',
      't9-cash-vs-mtt',
    ],
  },
];

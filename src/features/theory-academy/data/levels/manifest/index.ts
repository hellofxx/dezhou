/**
 * 理论学院目录摘要总索引（AUTO-GENERATED 文件见同目录 *-deck/heads-up/standard）。
 * 仅含 Level/章节目录元数据；正文与小测在 variants/* 完整数据中，按章节路由懒加载。
 */
import type { TheoryLevelSummary } from '../../../types';
import { STANDARD_LEVEL_SUMMARIES } from './standard';
import { SHORT_DECK_LEVEL_SUMMARIES } from './short-deck';
import { HEADS_UP_LEVEL_SUMMARIES } from './heads-up';

export { STANDARD_LEVEL_SUMMARIES } from './standard';
export { SHORT_DECK_LEVEL_SUMMARIES } from './short-deck';
export { HEADS_UP_LEVEL_SUMMARIES } from './heads-up';

export const ALL_VARIANT_LEVEL_SUMMARIES: TheoryLevelSummary[] = [
  ...STANDARD_LEVEL_SUMMARIES,
  ...SHORT_DECK_LEVEL_SUMMARIES,
  ...HEADS_UP_LEVEL_SUMMARIES,
];

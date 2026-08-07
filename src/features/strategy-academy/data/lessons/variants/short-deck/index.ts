import type { Lesson } from '../../../../types';
import { SHORT_DECK_LEVEL_3_LESSONS } from './shortDeckLevel3';
import { SHORT_DECK_LEVEL_4_LESSONS } from './shortDeckLevel4';
import { SHORT_DECK_LEVEL_5_LESSONS } from './shortDeckLevel5';
import { SHORT_DECK_LEVEL_6_LESSONS } from './shortDeckLevel6';
import { SHORT_DECK_LEVEL_7_LESSONS } from './shortDeckLevel7';
import { SHORT_DECK_LEVEL_8_LESSONS } from './shortDeckLevel8';

/**
 * Short Deck（短牌）策略课程聚合。
 * 各 Level 课程分散于 shortDeckLevel3.ts ~ shortDeckLevel8.ts（每 Level 单文件），
 * 本文件仅负责聚合导出 SHORT_DECK_STRATEGY_COURSES，供变体索引消费。
 */
export const SHORT_DECK_STRATEGY_COURSES: Lesson[] = [
  ...SHORT_DECK_LEVEL_3_LESSONS,
  ...SHORT_DECK_LEVEL_4_LESSONS,
  ...SHORT_DECK_LEVEL_5_LESSONS,
  ...SHORT_DECK_LEVEL_6_LESSONS,
  ...SHORT_DECK_LEVEL_7_LESSONS,
  ...SHORT_DECK_LEVEL_8_LESSONS,
];

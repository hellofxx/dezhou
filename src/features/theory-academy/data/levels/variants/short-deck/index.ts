/**
 * Short Deck（短牌）理论 Level 聚合。
 * 各 Level 内容分散于 shortDeckLevel1.ts ~ shortDeckLevel9.ts（每 Level 单文件），
 * 本文件仅负责聚合导出 shortDeckLevels，供变体索引消费。
 * ID 命名规则：t{level}sd-{topic}
 */
import type { TheoryLevelInfo } from '../../../../types';
import { SHORT_DECK_LEVEL_1 } from './shortDeckLevel1';
import { SHORT_DECK_LEVEL_2 } from './shortDeckLevel2';
import { SHORT_DECK_LEVEL_3 } from './shortDeckLevel3';
import { SHORT_DECK_LEVEL_4 } from './shortDeckLevel4';
import { SHORT_DECK_LEVEL_5 } from './shortDeckLevel5';
import { SHORT_DECK_LEVEL_6 } from './shortDeckLevel6';
import { SHORT_DECK_LEVEL_7 } from './shortDeckLevel7';
import { SHORT_DECK_LEVEL_8 } from './shortDeckLevel8';
import { SHORT_DECK_LEVEL_9 } from './shortDeckLevel9';

/** Short Deck 全部 Level（T1-T9） */
export const shortDeckLevels: TheoryLevelInfo[] = [
  SHORT_DECK_LEVEL_1,
  SHORT_DECK_LEVEL_2,
  SHORT_DECK_LEVEL_3,
  SHORT_DECK_LEVEL_4,
  SHORT_DECK_LEVEL_5,
  SHORT_DECK_LEVEL_6,
  SHORT_DECK_LEVEL_7,
  SHORT_DECK_LEVEL_8,
  SHORT_DECK_LEVEL_9,
];

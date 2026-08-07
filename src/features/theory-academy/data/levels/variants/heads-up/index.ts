/**
 * Heads-Up（单挑）理论 Level 聚合。
 * 各 Level 内容分散于 headsUpLevel1.ts ~ headsUpLevel9.ts（每 Level 单文件），
 * 本文件仅负责聚合导出 headsUpLevels，供变体索引消费。
 * ID 命名规则：t{level}hu-{topic}
 */
import type { TheoryLevelInfo } from '../../../../types';
import { HEADS_UP_LEVEL_1 } from './headsUpLevel1';
import { HEADS_UP_LEVEL_2 } from './headsUpLevel2';
import { HEADS_UP_LEVEL_3 } from './headsUpLevel3';
import { HEADS_UP_LEVEL_4 } from './headsUpLevel4';
import { HEADS_UP_LEVEL_5 } from './headsUpLevel5';
import { HEADS_UP_LEVEL_6 } from './headsUpLevel6';
import { HEADS_UP_LEVEL_7 } from './headsUpLevel7';
import { HEADS_UP_LEVEL_8 } from './headsUpLevel8';
import { HEADS_UP_LEVEL_9 } from './headsUpLevel9';

/** Heads-Up 全部 Level（T1-T9） */
export const headsUpLevels: TheoryLevelInfo[] = [
  HEADS_UP_LEVEL_1,
  HEADS_UP_LEVEL_2,
  HEADS_UP_LEVEL_3,
  HEADS_UP_LEVEL_4,
  HEADS_UP_LEVEL_5,
  HEADS_UP_LEVEL_6,
  HEADS_UP_LEVEL_7,
  HEADS_UP_LEVEL_8,
  HEADS_UP_LEVEL_9,
];

import type { Lesson } from '../../../../types';
import { HEADS_UP_LEVEL_3_LESSONS } from './headsUpLevel3';
import { HEADS_UP_LEVEL_4_LESSONS } from './headsUpLevel4';
import { HEADS_UP_LEVEL_5_LESSONS } from './headsUpLevel5';
import { HEADS_UP_LEVEL_6_LESSONS } from './headsUpLevel6';
import { HEADS_UP_LEVEL_7_LESSONS } from './headsUpLevel7';
import { HEADS_UP_LEVEL_8_LESSONS } from './headsUpLevel8';

/**
 * Heads-Up（单挑）策略课程聚合。
 * 各 Level 课程分散于 headsUpLevel3.ts ~ headsUpLevel8.ts（每 Level 单文件），
 * 本文件仅负责聚合导出 HEADS_UP_STRATEGY_COURSES，供变体索引消费。
 */
export const HEADS_UP_STRATEGY_COURSES: Lesson[] = [
  ...HEADS_UP_LEVEL_3_LESSONS,
  ...HEADS_UP_LEVEL_4_LESSONS,
  ...HEADS_UP_LEVEL_5_LESSONS,
  ...HEADS_UP_LEVEL_6_LESSONS,
  ...HEADS_UP_LEVEL_7_LESSONS,
  ...HEADS_UP_LEVEL_8_LESSONS,
];

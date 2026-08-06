/**
 * 变体 Level 集合导出
 * Day 2-3: 游戏变体支持扩展 - 骨架文件索引
 * Day 5: 集成总索引与按变体查询函数
 */
import type { TheoryLevelInfo } from '../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { THEORY_LEVELS } from '../index';
import { shortDeckLevels } from './short-deck';
import { headsUpLevels } from './heads-up';

export { shortDeckLevels } from './short-deck';
export { headsUpLevels } from './heads-up';

/**
 * 所有变体的 Level 总索引（standard 复用主 THEORY_LEVELS，避免数据重复）
 */
export const ALL_VARIANT_THEORY_LEVELS: TheoryLevelInfo[] = [
  ...THEORY_LEVELS,
  ...shortDeckLevels,
  ...headsUpLevels,
];

/** 按变体过滤 Level 列表（standard 返回主 THEORY_LEVELS） */
export function getTheoryLevelsByVariant(variant: PokerVariant): TheoryLevelInfo[] {
  switch (variant) {
    case 'short-deck':
      return shortDeckLevels;
    case 'heads-up':
      return headsUpLevels;
    default:
      return THEORY_LEVELS;
  }
}

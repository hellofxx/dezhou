/**
 * 变体 Level 集合导出
 * Day 2-3: 游戏变体支持扩展 - 骨架文件索引
 * Day 5: 集成总索引与按变体查询函数
 */
import type { TheoryLevelInfo } from '../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { standardLevels } from './standard';
import { shortDeckLevels } from './short-deck';
import { headsUpLevels } from './heads-up';

export { standardLevels } from './standard';
export { shortDeckLevels } from './short-deck';
export { headsUpLevels } from './heads-up';

/**
 * 所有变体的 Level 总索引（三变体平级：standard / short-deck / heads-up）
 */
export const ALL_VARIANT_THEORY_LEVELS: TheoryLevelInfo[] = [
  ...standardLevels,
  ...shortDeckLevels,
  ...headsUpLevels,
];

/** 按变体过滤 Level 列表（standard 返回标准变体 Level） */
export function getTheoryLevelsByVariant(variant: PokerVariant): TheoryLevelInfo[] {
  switch (variant) {
    case 'short-deck':
      return shortDeckLevels;
    case 'heads-up':
      return headsUpLevels;
    default:
      return standardLevels;
  }
}

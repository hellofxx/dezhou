import type { LessonMeta } from '../../types';

/** Level 8（高级剥削策略）课时元数据：池子倾向读法归 T7，剥削调整落点归 T9 统一框架。 */
export const LEVEL_8_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t7-player-types；样本指标补 t7-stats
  'l8-pool-tendencies': { eloDimension: 'handReading', theoryAnchors: ['t7-player-types', 't7-stats'] },
  'l8-population-analysis': { eloDimension: 'math', theoryAnchors: ['t7-stats', 't7-exploit'] },
  // 内联 t9-unified
  'l8-exploitative-adjustments': {
    eloDimension: 'postflop',
    theoryAnchors: ['t7-exploit', 't9-unified'],
  },
  'drill-l8-exploit': { eloDimension: 'postflop', theoryAnchors: ['t7-exploit', 't9-unified'] },
  'drill-l8-pool': { eloDimension: 'handReading', theoryAnchors: ['t7-player-types', 't7-stats'] },
};

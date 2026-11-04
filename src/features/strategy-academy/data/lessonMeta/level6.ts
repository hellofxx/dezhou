import type { LessonMeta } from '../../types';

/** Level 6（锦标赛策略）课时元数据：ICM 与泡沫期归 T9，Push/Fold 偏翻前。 */
export const LEVEL_6_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t9-icm；ICM 的成因是现金/锦标赛结构差异，补 t9-cash-vs-mtt
  'l6-icm': { eloDimension: 'math', theoryAnchors: ['t9-icm', 't9-cash-vs-mtt'] },
  'l6-pushfold': { eloDimension: 'preflop', theoryAnchors: ['t9-icm', 't4-preflop-structure'] },
  // 内联 t9-multiway；泡沫期的主要对手是 ICM 压力
  'l6-bubble': { eloDimension: 'math', theoryAnchors: ['t9-icm', 't9-cash-vs-mtt'] },
  'l6-finaltable': { eloDimension: 'preflop', theoryAnchors: ['t9-icm', 't3-blind-battle'] },
  'l6-bounty': { eloDimension: 'math', theoryAnchors: ['t9-icm', 't2-ev'] },
  'drill-l6-icm': { eloDimension: 'math', theoryAnchors: ['t9-icm', 't9-cash-vs-mtt'] },
  'drill-l6-pushfold': {
    eloDimension: 'preflop',
    theoryAnchors: ['t9-icm', 't4-preflop-structure'],
  },
};

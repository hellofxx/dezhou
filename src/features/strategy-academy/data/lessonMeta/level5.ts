import type { LessonMeta } from '../../types';

/** Level 5（职业素养）课时元数据：心态/资金/复盘归 T8，数据分析归 T7。 */
export const LEVEL_5_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t8-bankroll-psych；波动与破产风险补 t1-variance
  'l5-bankroll': { eloDimension: 'mental', theoryAnchors: ['t8-bankroll-psych', 't1-variance'] },
  // 内联 t8-tilt
  'l5-tilt': { eloDimension: 'mental', theoryAnchors: ['t8-tilt', 't8-mindset'] },
  'l5-game-selection': { eloDimension: 'mental', theoryAnchors: ['t8-session', 't8-mindset'] },
  // 内联 t8-session；复盘依赖样本指标补 t7-stats
  'l5-session-review': { eloDimension: 'mental', theoryAnchors: ['t8-session', 't7-stats'] },
  'l5-data-driven': { eloDimension: 'math', theoryAnchors: ['t7-stats', 't7-exploit'] },
  'drill-l5-tilt': { eloDimension: 'mental', theoryAnchors: ['t8-tilt', 't8-mindset'] },
  'l5-tools': { eloDimension: 'math', theoryAnchors: ['t7-stats', 't9-mop'] },
  // 线上线下差异 = 环境/心态差异，兼有抽水结构差异
  'l5-online-vs-live': {
    eloDimension: 'mental',
    theoryAnchors: ['t8-mindset', 't4-structure-economics'],
  },
  'drill-l5-session': { eloDimension: 'mental', theoryAnchors: ['t8-session', 't8-tilt'] },
};

import type { LessonMeta } from '../../types';

/** Level 7（现金桌专项）标准课时元数据：本土路径课时见 ./local.ts。 */
export const LEVEL_7_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t6-geometric；深筹码的隐含赔率补 t2-implied-odds
  'l7-deepstack': { eloDimension: 'postflop', theoryAnchors: ['t6-geometric', 't2-implied-odds'] },
  // 内联 t9-multiway；多人底池频率补 t5-multiway-frequency
  'l7-multiway': { eloDimension: 'postflop', theoryAnchors: ['t9-multiway', 't5-multiway-frequency'] },
  // 内联 t3-position-value；Straddle 属结构经济学
  'l7-straddle': { eloDimension: 'preflop', theoryAnchors: ['t4-structure-economics', 't3-position-value'] },
  'l7-rake': { eloDimension: 'math', theoryAnchors: ['t4-structure-economics', 't9-alpha'] },
  'l7-table-selection': { eloDimension: 'mental', theoryAnchors: ['t8-session', 't8-mindset'] },
  'drill-l7-deepstack': { eloDimension: 'postflop', theoryAnchors: ['t6-geometric', 't2-implied-odds'] },
  'drill-l7-multiway': {
    eloDimension: 'postflop',
    theoryAnchors: ['t9-multiway', 't5-multiway-frequency'],
  },
};

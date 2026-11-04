import type { LessonMeta } from '../../types';

/** Level 3（翻后策略）课时元数据：锚点集中在 T6 下注理论族与 T5 频率族。 */
export const LEVEL_3_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t5-gto-concept；下注目的补 t6-bet-purpose
  'l3-cbet': { eloDimension: 'postflop', theoryAnchors: ['t5-gto-concept', 't6-bet-purpose'] },
  // 内联 t1-outs；听牌的隐含赔率补 t2-implied-odds
  'l3-draws': { eloDimension: 'postflop', theoryAnchors: ['t1-outs', 't2-implied-odds'] },
  // 内联 t6-geometric；转河连续施压补 t6-turn-river
  'l3-multistreet': { eloDimension: 'postflop', theoryAnchors: ['t6-geometric', 't6-turn-river'] },
  'l3-checkraise': { eloDimension: 'postflop', theoryAnchors: ['t6-bet-purpose', 't5-mdf-alpha'] },
  'l3-float-probe': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6-srp-postflop', 't5-gto-concept'],
  },
  // 内联 t5-mdf-alpha；尺度理论补 t6-sizing-theory
  'l3-bet-sizing': { eloDimension: 'postflop', theoryAnchors: ['t6-sizing-theory', 't5-mdf-alpha'] },
  'l3-bluffing': {
    eloDimension: 'postflop',
    theoryAnchors: ['t9-alpha', 't6-bet-purpose'],
  },
  'l3-texture': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6-equity-realization', 't4-range-advantage'],
  },
  'l3-check-range': {
    eloDimension: 'postflop',
    theoryAnchors: ['t4-range-advantage', 't5-mixed-strategy'],
  },
  'drill-l3-cbet': { eloDimension: 'postflop', theoryAnchors: ['t6-bet-purpose', 't5-gto-concept'] },
  'drill-l3-odds': { eloDimension: 'math', theoryAnchors: ['t1-outs', 't2-pot-odds'] },
  'l3-3bet-postflop': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6-3bet-pot', 't6-equity-realization'],
  },
};

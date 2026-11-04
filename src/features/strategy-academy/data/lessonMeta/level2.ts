import type { LessonMeta } from '../../types';

/** Level 2（翻前策略）课时元数据：全部翻前决策，锚点集中在 T4 翻前范围族与 T3 盲注战。 */
export const LEVEL_2_LESSON_META: Record<string, LessonMeta> = {
  // 内联 t2-pot-odds（加注尺度的价格含义）；范围基准补 t4-preflop-structure
  'l2-raise-sizing': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-preflop-structure', 't2-pot-odds'],
  },
  // 内联 t4-combinatorics（3-bet 组合计数）
  'l2-3bet-basics': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-combinatorics', 't4-preflop-structure'],
  },
  // 内联 t4-range-thinking
  'l2-4bet-strategy': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-range-thinking', 't4-preflop-structure'],
  },
  'l2-squeeze': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-preflop-structure', 't4-sixmax-ranges'],
  },
  'l2-bb-defense': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-sixmax-ranges', 't3-blind-battle'],
  },
  'l2-blind-war': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3-blind-battle', 't4-sixmax-ranges'],
  },
  // 短筹码翻前与 SPR/几何尺度直接相关
  'l2-short-stack': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-preflop-structure', 't6-geometric'],
  },
  'drill-l2-3bet': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-preflop-structure', 't4-combinatorics'],
  },
  'drill-l2-position-range': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-sixmax-ranges', 't1-sixmax-table'],
  },
};

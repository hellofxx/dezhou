import type { LessonMeta } from '../../types';

/**
 * Level 4（进阶思维，4A 范围与 EV + 4B GTO 与博弈论）课时元数据。
 * 4A 偏读牌/数学，4B 偏频率与混合策略。
 */
export const LEVEL_4_LESSON_META: Record<string, LessonMeta> = {
  // ===== 4A =====
  // 内联 t4-range-thinking；读牌流程补 t7-hand-reading
  'l4-range-thinking': {
    eloDimension: 'handReading',
    theoryAnchors: ['t4-range-thinking', 't7-hand-reading'],
  },
  // 内联 t2-ev；EV 的公理化推导补 t9-mop
  'l4-ev-thinking': { eloDimension: 'math', theoryAnchors: ['t2-ev', 't9-mop'] },
  'l4-ev-real-cases': { eloDimension: 'math', theoryAnchors: ['t2-ev', 't2-implied-odds'] },
  // 内联 t7-hand-reading
  'l4-opponent-reading': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7-hand-reading', 't7-player-types'],
  },
  // 内联 t4-combinatorics
  'l4-blockers': { eloDimension: 'handReading', theoryAnchors: ['t4-combinatorics', 't7-hand-reading'] },
  'drill-l4-range-id': {
    eloDimension: 'handReading',
    theoryAnchors: ['t4-range-thinking', 't7-hand-reading'],
  },
  'drill-l4-ev': { eloDimension: 'math', theoryAnchors: ['t2-ev', 't9-alpha'] },
  // ===== 4B =====
  // 内联 t5-game-theory
  'l4-gto-basics': { eloDimension: 'math', theoryAnchors: ['t5-game-theory', 't5-gto-concept'] },
  // 内联 t5-mixed-strategy
  'l4-game-tree': { eloDimension: 'math', theoryAnchors: ['t5-mixed-strategy', 't5-game-theory'] },
  // 内联 t5-gto-concept
  'l4-frequency-balance': {
    eloDimension: 'postflop',
    theoryAnchors: ['t5-gto-concept', 't5-mixed-strategy'],
  },
  // 内联 t5-mdf-alpha
  'l4-mdf': { eloDimension: 'math', theoryAnchors: ['t5-mdf-alpha', 't9-alpha'] },
  'l4-mdf-real-cases': { eloDimension: 'math', theoryAnchors: ['t5-mdf-alpha', 't2-pot-odds'] },
  'l4-overbet': { eloDimension: 'postflop', theoryAnchors: ['t6-sizing-theory', 't4-range-advantage'] },
  // 内联 t4-range-thinking
  'l4-range-construction': {
    eloDimension: 'postflop',
    theoryAnchors: ['t4-range-thinking', 't4-range-advantage'],
  },
  'l4-bluffcatching': {
    eloDimension: 'handReading',
    theoryAnchors: ['t5-mdf-alpha', 't7-hand-reading'],
  },
  'drill-l4-gto': { eloDimension: 'postflop', theoryAnchors: ['t5-gto-concept', 't5-mixed-strategy'] },
  'drill-l4b-frequency': {
    eloDimension: 'postflop',
    theoryAnchors: ['t5-mixed-strategy', 't5-mdf-alpha'],
  },
};

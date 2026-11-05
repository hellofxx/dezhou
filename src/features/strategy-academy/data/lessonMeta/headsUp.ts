import type { LessonMeta } from '../../types';

/**
 * Heads-Up（单挑）课时元数据（ELO 维度 + 理论锚点）。
 *
 * 锚点只指向理论学院单挑 37 章（`t<n>hu-*`），与标准课锚点分表维护；
 * 存在性与变体归属由 `lessonMeta.integrity.test.ts` 与 `theoryReferenceIntegrity.test.ts`
 * 分别断言。锚点选取与课时的 2 条内联 theory-reference 同源，保证「正文引用」与
 * 「完成页桥接」指向同一章。
 */
export const HEADS_UP_LESSON_META: Record<string, LessonMeta> = {
  // L3 翻后策略
  'l3hu-bn-aggression': {
    eloDimension: 'postflop',
    theoryAnchors: ['t3hu-sb-strategy', 't3hu-position-reversal'],
  },
  'l3hu-sb-continuation': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6hu-sizing-optimal', 't6hu-equity-realization'],
  },
  'l3hu-bb-defense': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3hu-bb-defense', 't4hu-preflop-structure'],
  },
  // L4 进阶思维
  'l4hu-bn-opening': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4hu-range-width', 't5hu-preflop-equilibrium'],
  },
  'l4hu-ev-adjustments': {
    eloDimension: 'math',
    theoryAnchors: ['t2hu-ev', 't2hu-risk'],
  },
  'l4hu-gto-basics': {
    eloDimension: 'math',
    theoryAnchors: ['t5hu-gto-he', 't5hu-frequency'],
  },
  'l4hu-counter-strategies': {
    eloDimension: 'postflop',
    theoryAnchors: ['t5hu-node-locking', 't7hu-exploit'],
  },
  // L5 职业素养
  'l5hu-focus': {
    eloDimension: 'mental',
    theoryAnchors: ['t8hu-pressure', 't8hu-tilt-types'],
  },
  'l5hu-opponent-psychology': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7hu-hand-reading', 't8hu-reads'],
  },
  // L6 锦标赛
  'l6hu-tourney': {
    eloDimension: 'math',
    theoryAnchors: ['t9hu-icm', 't9hu-cash-vs-mtt'],
  },
  // L7 现金桌
  'l7hu-stakes': {
    eloDimension: 'postflop',
    theoryAnchors: ['t9hu-mastery', 't9hu-unified'],
  },
  // L8 高级剥削
  'l8hu-exploitative': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7hu-exploit', 't7hu-stats'],
  },
};

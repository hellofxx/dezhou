import type { LessonMeta } from '../../types';

/**
 * 短牌（6+ Hold'em）课时元数据（ELO 维度 + 理论锚点）。
 *
 * 锚点由理论侧 `short-deck/chapterPracticeMap.ts` 的「章节 → 实践课」反演而来：
 * 章节把哪门课列为实践推荐，该课就回锚该章，保证双向引用同源、不凭空发明映射。
 * `l3sd-donk` 在章节侧无推荐条目，按「下注策略」归入 T6 Barrel（与 C-Bet / Check-Raise 同章）。
 * 存在性与变体归属由 `lessonMeta.integrity.test.ts` 断言。
 */
export const SHORT_DECK_LESSON_META: Record<string, LessonMeta> = {
  // L3 翻后策略
  'l3sd-intro': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3sd-rankings'],
  },
  'l3sd-cbet': {
    eloDimension: 'postflop',
    theoryAnchors: ['t3sd-position', 't6sd-sizing', 't6sd-barrel'],
  },
  'l3sd-donk': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6sd-barrel'],
  },
  'l3sd-check-raise': {
    eloDimension: 'postflop',
    theoryAnchors: ['t6sd-barrel'],
  },
  // L4 进阶思维
  'l4sd-preflop-ranges': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3sd-rankings', 't3sd-suitedness', 't4sd-range-construction'],
  },
  'l4sd-nuts-equity': {
    eloDimension: 'math',
    theoryAnchors: ['t1sd-combinatorics', 't2sd-potodds', 't4sd-equity', 't6sd-equity-realization'],
  },
  'l4sd-blocker-bluff': {
    eloDimension: 'math',
    theoryAnchors: ['t4sd-blockers', 't5sd-bluff'],
  },
  'l4sd-gto-fundamentals': {
    eloDimension: 'math',
    theoryAnchors: ['t5sd-gto-short', 't5sd-bluff', 't5sd-mixed-strategy'],
  },
  'l4sd-solver-readout': {
    eloDimension: 'math',
    theoryAnchors: ['t5sd-mixed-strategy', 't9sd-integration'],
  },
  // L5 职业素养
  'l5sd-bankroll': {
    eloDimension: 'mental',
    theoryAnchors: ['t1sd-variance', 't8sd-variance', 't8sd-bankroll'],
  },
  'l5sd-tilt-control': {
    eloDimension: 'mental',
    theoryAnchors: ['t8sd-tilt', 't8sd-bankroll'],
  },
  // L6 锦标赛
  'l6sd-tourney-i': {
    eloDimension: 'math',
    theoryAnchors: ['t9sd-case-study', 't9sd-tournament-structure'],
  },
  'l6sd-tourney-ii': {
    eloDimension: 'math',
    theoryAnchors: ['t9sd-tournament-structure'],
  },
  // L7 现金桌
  'l7sd-deep-stack': {
    eloDimension: 'postflop',
    theoryAnchors: ['t2sd-implied', 't6sd-equity-realization', 't9sd-integration'],
  },
  'l7sd-shallow-stack': {
    eloDimension: 'preflop',
    theoryAnchors: ['t2sd-reverse'],
  },
  // L8 高级剥削
  'l8sd-exploit-i': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7sd-mistakes', 't7sd-adjustment', 't7sd-hud'],
  },
  'l8sd-exploit-ii': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7sd-adjustment', 't7sd-hud', 't9sd-case-study'],
  },
};
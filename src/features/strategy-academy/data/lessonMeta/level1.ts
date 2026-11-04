import type { LessonMeta } from '../../types';

/**
 * Level 1（基础入门）课时元数据。
 *
 * 锚点选取原则：课时正文内已内联 `type: 'theory-reference'` 的章节优先（正文与锚点同源），
 * 其余按“本课结论在理论学院哪一章给出推导”补一条，保持每题 1–2 个锚点。
 */
export const LEVEL_1_LESSON_META: Record<string, LessonMeta> = {
  'l1-basics': { eloDimension: 'math', theoryAnchors: ['t1-combinatorics'] },
  // 内联 t3-position-value；座位结构补 t1-sixmax-table
  'l1-position': { eloDimension: 'preflop', theoryAnchors: ['t3-position-value', 't1-sixmax-table'] },
  // 内联 t1-combinatorics；起手牌理论补 t3-starting-hands
  'l1-hand-selection': {
    eloDimension: 'preflop',
    theoryAnchors: ['t1-combinatorics', 't3-starting-hands'],
  },
  'l1-bankroll': { eloDimension: 'mental', theoryAnchors: ['t8-bankroll-psych', 't1-variance'] },
  // 内联 t2-ev；新手错误的认知来源补 t8-mindset
  'l1-leaks': { eloDimension: 'mental', theoryAnchors: ['t2-ev', 't8-mindset'] },
  'drill-hand-ranking': { eloDimension: 'handReading', theoryAnchors: ['t1-combinatorics'] },
  'drill-position': {
    eloDimension: 'preflop',
    theoryAnchors: ['t1-sixmax-table', 't3-position-value'],
  },
  'drill-outs': { eloDimension: 'math', theoryAnchors: ['t1-outs', 't2-pot-odds'] },
  'drill-pot-odds': { eloDimension: 'math', theoryAnchors: ['t2-pot-odds', 't2-ev'] },
};
